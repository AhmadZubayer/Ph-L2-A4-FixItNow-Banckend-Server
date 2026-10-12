# Booking service methods

Source: [booking.service.ts](../src/modules/booking/booking.service.ts)

## Methods and their purpose

- **`createBookingIntoDB`** — Claims a free technician slot and creates a requested booking. **Critical: transaction and conditional slot claim.**
- **`getMyBookingsFromDB`** — Lists the signed-in customer's bookings.
- **`getBookingByIdFromDB`** — Gets one booking belonging to the signed-in customer.
- **`getTechnicianBookingsFromDB`** — Lists bookings for the signed-in technician's services.
- **`updateBookingStatusIntoDB`** — Applies an allowed technician status change and may reopen a declined slot. **Critical: transaction and status rules.**
- **`cancelBookingIntoDB`** — Cancels a customer's booking, may reopen its slot, and may request a refund. **Critical: transaction followed by external refund.**

## Method flows

### 1. `createBookingIntoDB` — **CRITICAL: transaction + slot claim**

**Input**

1. **Start:** A customer calls `POST /api/bookings` with a service ID and availability slot ID. Authentication supplies their customer ID, validation checks the body, and the controller passes both here.
2. Record the current time and the booking statuses that occupy a slot: `REQUESTED`, `ACCEPTED`, `PAID`, and `IN_PROGRESS`.

**Database transaction**

1. Find the requested service. Require the service and its category to be active, and require the technician's account to be active.
2. If no service matches, stop with “Service not found.”
3. Find the requested slot. Require it to belong to **that service's technician**, be active, and start in the future.
4. If no slot matches, stop with “This slot is not available.”
5. Compare the slot's length with the service's required duration. If it is too short, stop.
6. Try to **claim** the slot with a conditional update: it must still be active, still be in the future, and have no booking with an active status.
7. If zero slots were updated, another request may have claimed it; stop with a conflict error.
8. Create a `REQUESTED` booking. Copy the slot's start/end times and the service price **from the database**, not from the customer's request.
9. Finish the transaction and return the booking to the controller. If creating the booking fails, the slot claim is rolled back too.

**Why the conditional claim matters**

1. Reading a free slot is not enough; another customer may book it before this request finishes.
2. The conditional update checks again at the moment the slot is claimed.

### 2. `getMyBookingsFromDB`

1. **Start:** A customer calls `GET /api/bookings`. Authentication supplies their customer ID, and the controller passes it here.
2. Find bookings with that `customerId`.
3. Include saved time, price, status, slot ID, service title, and technician name.
4. Sort newest bookings first.
5. Return the list to the controller.

### 3. `getBookingByIdFromDB`

1. **Start:** A customer calls `GET /api/bookings/:id`. The route validates the booking ID, authentication supplies the customer ID, and the controller passes both here.
2. Find a booking matching **both** the booking ID and customer ID.
3. If none matches, stop with “Booking not found.” This also hides another customer's booking.
4. Include the booking's saved details plus service, category, technician name, and technician location.
5. Return the booking to the controller.

### 4. `getTechnicianBookingsFromDB`

1. **Start:** A technician calls `GET /api/technician/bookings`. Authentication supplies their user ID, and the controller passes it here.
2. Find bookings whose service belongs to a technician profile with that user ID.
3. Include booking time, price, status, customer name, and service title.
4. Sort newest bookings first.
5. Return the list to the controller.

### 5. `updateBookingStatusIntoDB` — **CRITICAL: transaction + status rules**

**Input and allowed changes**

1. **Start:** A technician calls `PATCH /api/technician/bookings/:id`. The route validates the booking ID and requested status; authentication supplies the technician's user ID.
2. The controller passes booking ID, technician user ID, and new status here.
3. Start a database transaction and find the booking **only if its service belongs to this technician**.
4. If no booking matches, stop with “Booking not found.”
5. Allow only these changes: `REQUESTED → ACCEPTED`, `REQUESTED → DECLINED`, `PAID → IN_PROGRESS`, or `IN_PROGRESS → COMPLETED`.
6. If the requested change is not in that list, stop with a conflict error.

**Database update**

1. Change the booking status **only if its old status still matches** the one just read.
2. If zero bookings were updated, another request changed it first; stop with a conflict error.
3. If the new status is `DECLINED` and the slot starts in the future, try to make that slot active again.
4. Reopen the slot only if it has **no** booking in an active status.
5. Find the updated booking, finish the transaction, and return it to the controller. If a database step fails, the transaction rolls back.

### 6. `cancelBookingIntoDB` — **CRITICAL: transaction + refund after commit**

**Input**

1. **Start:** A customer calls `PATCH /api/bookings/:id/cancel`. The route validates the booking ID, authentication supplies the customer ID, and the controller passes both here.

**Database transaction**

1. Find the booking with **both** the booking ID and customer ID. Also look for a completed payment attached to it.
2. If no booking matches, stop with “Booking not found.”
3. If the booking is already `CANCELLED`, return that booking from the transaction and remember whether a completed payment still needs refund handling.
4. Otherwise, allow cancellation only from `REQUESTED`, `ACCEPTED`, or `PAID`. If it has another status, stop.
5. If the status is `PAID` but no completed payment was found, stop because the saved payment state is inconsistent.
6. Change the booking to `CANCELLED` **only if its old status still matches**. If zero rows changed, stop because another request changed it first.
7. If the slot starts in the future, try to make it active again, but only if no booking with an active status still uses it.
8. Return the cancelled booking and a `shouldRefund` flag. The flag is true when this was a paid booking.
9. Finish the transaction. A failure inside it rolls back the cancellation and slot change together.

**After the transaction: external refund**

1. If `shouldRefund` is false, return the cancelled booking to the controller.
2. If `shouldRefund` is true, call `paymentService.refundCancelledPaidBookingIntoDB` with the booking ID and wait for the refund request.
3. When the refund method finishes, return the cancelled booking to the controller.

**Why the refund is outside the transaction**

1. Save the booking cancellation and release the database transaction first.
2. Then contact the external payment provider. A Stripe error at this point can reach the controller, but it cannot undo the already saved cancellation.
