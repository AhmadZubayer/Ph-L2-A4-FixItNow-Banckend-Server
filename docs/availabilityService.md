# Availability service methods

Source: [availability.service.ts](../src/modules/availability/availability.service.ts)

## Methods and their purpose

- **`setAvailabilityIntoDB`** — Adds non-overlapping slots and returns the technician's free future slots. **Critical: overlap check inside a transaction.**

## Method flows

### 1. `setAvailabilityIntoDB` — **CRITICAL: transaction + overlap check**

**Before the transaction**

1. **Start:** A technician calls `PUT /api/technician/availability` with a list of time slots. Authentication supplies their user ID, and validation checks the times and prevents overlaps **within the new list**.
2. The controller passes the user ID and validated slots here.
3. Find that user's technician profile. If none exists, stop and ask them to create a profile first.
4. Make a list of booking statuses that keep a slot occupied: `REQUESTED`, `ACCEPTED`, `PAID`, and `IN_PROGRESS`. Record the current time.

**Database transaction**

1. Find this technician's existing slots that have not ended yet and are either active **or** connected to an active booking.
2. For every new slot, compare its start and end with every existing slot's start and end.
3. If any time periods overlap, stop with a conflict error. No new slots are saved.
4. If they do not overlap and the new list is not empty, create all new slots.
5. Find active slots whose start is in the future and which have **no** booking with an active status.
6. Sort those free slots by start time and return them to the controller. The transaction finishes.

**Why these checks matter**

1. Validation stops two **new** slots from overlapping each other.
2. The service stops a new slot from overlapping an **existing** slot, including one occupied by a booking.
3. Existing free future slots stay active; this method adds new availability rather than replacing the old list.
