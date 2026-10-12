# Technician service methods

Source: [technician.service.ts](../src/modules/technician/technician.service.ts)

## Methods and their purpose

- **`updateTechnicianProfileIntoDB`** — Creates a technician profile or updates the existing one. **Critical: upsert.**
- **`getTechnicianByIdFromDB`** — Gets one active technician with public services, free future slots, reviews, and rating. **Critical: availability and rating rules.**
- **`getAllTechniciansFromDB`** — Lists active technicians matching optional filters and adds ratings. **Critical: rating query and filter.**

## Method flows

### 1. `updateTechnicianProfileIntoDB` — **CRITICAL: upsert**

1. **Start:** A technician calls `PUT /api/technician/profile`. Authentication supplies their user ID, validation checks the body, and the controller passes both here.
2. Look for a technician profile whose `userId` matches this user.
3. If one exists, update it with the validated bio, skills, experience, location, and photo values.
4. If one does not exist, create it with those values and this user ID.
5. Return the saved profile to the controller.

**Why use upsert**

1. The same endpoint works for a technician's first profile and later edits.
2. The caller does not need separate “create profile” and “update profile” routes.

### 2. `getTechnicianByIdFromDB` — **CRITICAL: free slots + rating**

**Find public profile data**

1. **Start:** A visitor calls `GET /api/technicians/:id`. The route validates the ID, and the controller passes it here.
2. Find the technician profile by ID, but only if its user account is `ACTIVE`.
3. Include the technician's public profile details and name.
4. Include services only when the service **and** its category are active.
5. Include reviews and their customer names, newest first.
6. If no active technician matches, stop with “Technician not found.”

**Choose free future slots**

1. Look at this technician's availability slots.
2. Keep a slot only if it is active and its start time is still in the future.
3. Remove slots that have a booking in `REQUESTED`, `ACCEPTED`, `PAID`, or `IN_PROGRESS`.
4. Sort the remaining slots by start time.

**Calculate the rating**

1. Count the reviews returned with this technician.
2. If there are reviews, add their ratings and divide by the count. If none exist, use zero.
3. Return the profile, services, free slots, reviews, average rating, and review count to the controller.

### 3. `getAllTechniciansFromDB` — **CRITICAL: filters + grouped ratings**

**Find matching technicians**

1. **Start:** A visitor calls `GET /api/technicians` with optional query values. The route validates them, and the controller passes the filters here.
2. Start with technicians whose user account is `ACTIVE`.
3. If a category ID was given, keep technicians who have at least one active service in that active category.
4. If a location was given, match part of the location without caring about letter case.
5. Find matching profiles with selected user details and active services in active categories. Sort newest first.
6. If none match, return an empty list.

**Calculate and apply ratings**

1. Ask the review table for an average rating and review count for only these technician IDs.
2. Store those results in a map keyed by technician profile ID.
3. Add each technician's rating and count to the list. Use zero if they have no reviews.
4. If `minRating` was supplied, remove technicians below it.
5. Return the final list to the controller.

**Why use one grouped review query**

1. Get the matching technicians first.
2. Calculate ratings for them together instead of querying reviews separately for every technician.
