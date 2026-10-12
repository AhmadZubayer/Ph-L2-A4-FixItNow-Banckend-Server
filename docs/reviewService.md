# Review service methods

Source: [review.service.ts](../src/modules/review/review.service.ts)

## Methods and their purpose

- **`createReviewIntoDB`** — Lets a customer review one of their completed bookings once. **Critical: booking ownership and one-review rule.**

## Method flows

### 1. `createReviewIntoDB` — **CRITICAL: ownership + unique review**

**Check the booking**

1. **Start:** A customer calls `POST /api/reviews` with booking ID, rating, and optional comment. Authentication supplies the customer ID, validation checks the body, and the review controller passes both here.
2. Find a booking with the given booking ID **and** customer ID.
3. If no booking is found, stop with “Booking not found.” This also stops a customer from reviewing someone else's booking.
4. If its status is not `COMPLETED`, stop. An unfinished job cannot be reviewed.
5. Read the technician profile ID from the booking's service.

**Create the review**

1. Save the booking ID, customer ID, technician profile ID, rating, and optional comment.
2. If the database's unique rule says the booking already has a review, return “This booking already has a review.”
3. Otherwise, return the new review to the controller.
