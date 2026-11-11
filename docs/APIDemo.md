
**FixItNow — Postman Video Demo Requests**

**A. Prepare the accounts before recording**

Register these accounts once. If you already registered them, use the login requests instead.

**1. Register Customer — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/auth/register
```

Authorization: **No Auth**

```json
{
  "name": "Mahmud Hasan",
  "email": "mahmud.hasan.demo@example.com",
  "password": "DemoPass@123",
  "role": "CUSTOMER"
}
```

**2. Register Technician — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/auth/register
```

Authorization: **No Auth**

```json
{
  "name": "Rakib Ahmed",
  "email": "rakib.ahmed.demo@example.com",
  "password": "DemoPass@123",
  "role": "TECHNICIAN"
}
```

Admin accounts cannot be created through this public registration endpoint. Use your existing Admin credentials in the next request.

---

**B. Admin demonstration**

**3. Log in as Admin — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/auth/login
```

Authorization: **No Auth**

Replace the two placeholders with your actual Admin credentials.

```json
{
  "email": "YOUR_ADMIN_EMAIL",
  "password": "YOUR_ADMIN_PASSWORD"
}
```

**Save:** `data.accessToken` → `adminToken`.

**4. View all users — GET**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/admin/users
```

Bearer Token:

```text
{{adminToken}}
```

Body: **none**

Show that the response includes your Customer and Technician accounts.

**5. Create a category — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/admin/categories
```

Bearer Token:

```text
{{adminToken}}
```

```json
{
  "name": "Electrical Repair Demo",
  "slug": "electrical-repair-demo",
  "description": "Home electrical repair and maintenance services in Bangladesh."
}
```

**Save:** `data.id` → `categoryId`.

Use a unique name and slug when repeating the recording, for example `Electrical Repair Demo 2` and `electrical-repair-demo-2`.

---

**C. Technician demonstration**

**6. Log in as Technician — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/auth/login
```

Authorization: **No Auth**

```json
{
  "email": "rakib.ahmed.demo@example.com",
  "password": "DemoPass@123"
}
```

**Save:** `data.accessToken` → `technicianToken`.

**7. Create or update technician profile — PUT**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technician/profile
```

Bearer Token:

```text
{{technicianToken}}
```

```json
{
  "bio": "I am Rakib Ahmed, an electrician providing home repair services in Dhaka.",
  "skills": [
    "Electrical wiring",
    "Ceiling fan repair",
    "Switch and socket repair"
  ],
  "experienceYears": 5,
  "location": "Mirpur, Dhaka"
}
```

**Save:** `data.id` → `technicianProfileId`.

This endpoint creates the profile if it does not exist and updates it if it does. To clearly demonstrate an update, change `experienceYears` to `6`, resend, and show the changed response.

**8. Create a service — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technician/services
```

Bearer Token:

```text
{{technicianToken}}
```

```json
{
  "title": "Ceiling Fan Repair",
  "description": "Inspection and repair of a ceiling fan at your home in Mirpur, Dhaka.",
  "price": "800.00",
  "durationMinutes": 60,
  "categoryId": "{{categoryId}}"
}
```

**Save:** `data.id` → `serviceId`.

Keep `price` in quotation marks: your API requires a string.

**9. Add two availability slots — PUT**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technician/availability
```

Bearer Token:

```text
{{technicianToken}}
```

```json
{
  "slots": [
    {
      "startAt": "2026-11-10T10:00:00+06:00",
      "endAt": "2026-11-10T11:00:00+06:00"
    },
    {
      "startAt": "2026-11-10T14:00:00+06:00",
      "endAt": "2026-11-10T15:00:00+06:00"
    }
  ]
}
```

These are Bangladesh times. **Change the dates if you record on or after November 10, 2026.** Slots must be in the future and must not overlap existing slots.

From the returned `data` array, identify the slots by their times:

- Save the morning slot’s `id` → `slotId`.
- Save the afternoon slot’s `id` → `secondSlotId`.

The response can include older available slots too, so select by time rather than assuming the first two are the new ones.

---

**D. Customer demonstration**

**10. Log in as Customer — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/auth/login
```

Authorization: **No Auth**

```json
{
  "email": "mahmud.hasan.demo@example.com",
  "password": "DemoPass@123"
}
```

**Save:** `data.accessToken` → `customerToken`.

**11. Browse services — GET**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/services
```

Authorization: **No Auth**

Body: **none**

Optional filtered version:

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/services?location=Mirpur&minPrice=500&maxPrice=1000
```

**12. View Rakib’s technician profile — GET**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technicians/{{technicianProfileId}}
```

Authorization: **No Auth**

Body: **none**

This uses the **technician profile ID**, not the technician’s user ID.

**13. Create a booking — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/bookings
```

Bearer Token:

```text
{{customerToken}}
```

```json
{
  "serviceId": "{{serviceId}}",
  "availabilitySlotId": "{{slotId}}"
}
```

**Save:** `data.id` → `bookingId`.

Show the returned status: **REQUESTED**.

**14. View the booking — GET**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/bookings/{{bookingId}}
```

Bearer Token:

```text
{{customerToken}}
```

Body: **none**

Show the service, appointment times, price, and status.

---

**E. Technician accepts the booking**

**15. View assigned bookings — GET**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technician/bookings
```

Bearer Token:

```text
{{technicianToken}}
```

Body: **none**

**16. Accept the booking — PATCH**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technician/bookings/{{bookingId}}
```

Bearer Token:

```text
{{technicianToken}}
```

```json
{
  "status": "ACCEPTED"
}
```

Show the updated status: **ACCEPTED**.

---

**F. Customer payment**

**17. Create Stripe checkout — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/payments/create
```

Bearer Token:

```text
{{customerToken}}
```

```json
{
  "bookingId": "{{bookingId}}",
  "provider": "STRIPE"
}
```

The booking must already be **ACCEPTED**.

**Save:** `data.paymentId` → `paymentId`.

Open the returned `data.checkoutUrl` in your browser and complete checkout using your configured Stripe test environment.

Creating the checkout session alone does **not** mean the payment succeeded.

**18. Check payment status — GET**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/payments/{{paymentId}}
```

Bearer Token:

```text
{{customerToken}}
```

Body: **none**

After successful payment confirmation, show **COMPLETED**.

Then resend request **14** to show that the booking is **PAID**. If payment confirmation has not arrived yet, wait and retrieve it again before continuing.

---

**G. Complete the job and leave a review**

**19. Start the job — PATCH**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technician/bookings/{{bookingId}}
```

Bearer Token:

```text
{{technicianToken}}
```

```json
{
  "status": "IN_PROGRESS"
}
```

The booking must be **PAID** first.

**20. Complete the job — PATCH**

Use the same URL and Technician token:

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/technician/bookings/{{bookingId}}
```

```json
{
  "status": "COMPLETED"
}
```

The booking must be **IN_PROGRESS** first.

**21. Submit a review — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/reviews
```

Bearer Token:

```text
{{customerToken}}
```

```json
{
  "bookingId": "{{bookingId}}",
  "rating": 5,
  "comment": "Rakib bhai repaired the ceiling fan quickly and explained the issue clearly. Very satisfied with the service."
}
```

Reviews require a **COMPLETED** booking. Each booking can have only one review.

---

**H. Demonstrate cancellation with a separate booking**

**22. Create another booking — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/bookings
```

Bearer Token:

```text
{{customerToken}}
```

```json
{
  "serviceId": "{{serviceId}}",
  "availabilitySlotId": "{{secondSlotId}}"
}
```

**Save:** `data.id` → `cancelBookingId`.

Do not overwrite `bookingId`.

**23. Cancel the second booking — PATCH**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/bookings/{{cancelBookingId}}/cancel
```

Bearer Token:

```text
{{customerToken}}
```

Body: **none**

Show the status: **CANCELLED**.

Use this second booking because the completed booking cannot be cancelled.

---

**I. Demonstrate validation and error handling**

**24. Invalid service ID — POST**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/bookings
```

Bearer Token:

```text
{{customerToken}}
```

```json
{
  "serviceId": "invalid-id",
  "availabilitySlotId": "{{slotId}}"
}
```

Expected: **400 Bad Request**, with:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [
    {
      "field": "serviceId",
      "message": "A valid service ID is required"
    }
  ]
}
```

**25. Customer attempts an Admin action — GET**

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/admin/users
```

Deliberately use the **Customer** Bearer Token:

```text
{{customerToken}}
```

Body: **none**

Expected: **403 Forbidden**, with the message:

```text
You do not have permission to access this resource
```

**26. Optional: demonstrate a booked-slot conflict — POST**

Run this immediately after request **13**, while that booking is still active.

```text
https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app/api/bookings
```

Bearer Token:

```text
{{customerToken}}
```

```json
{
  "serviceId": "{{serviceId}}",
  "availabilitySlotId": "{{slotId}}"
}
```

Expected: **409 Conflict**, normally with:

```text
This slot is not available
```

This supports your explanation of preventing duplicate bookings.

**Recording order**

Prepare requests **1–2** before recording. During the video, follow **3–25**, skipping optional requests or extra listing requests to stay within your time limit. Keep the request bodies ready so you spend recording time explaining responses rather than typing.
