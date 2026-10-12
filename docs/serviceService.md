# Service service methods

Source: [service.service.ts](../src/modules/service/service.service.ts)

## Methods and their purpose

- **`createServiceIntoDB`** — Lets a technician create a service under an active category.
- **`getAllServicesFromDB`** — Finds public services matching optional filters and adds technician ratings. **Critical: separate rating query and filter.**

## Method flows

### 1. `createServiceIntoDB`

1. **Start:** A technician calls `POST /api/technician/services`. Authentication supplies their user ID, validation checks the body, and the service controller passes both here.
2. Find the technician profile belonging to that user ID.
3. If no profile exists, stop and ask the technician to create one first.
4. Find the requested category by ID and require `isActive: true`.
5. If no active category exists, stop with “Active category not found.”
6. Create the service using the validated title, description, price, duration, and category ID, plus the profile ID from the database.
7. Return the created service to the controller.

### 2. `getAllServicesFromDB` — **CRITICAL: public filters + rating calculation**

**Build the database filter**

1. **Start:** A visitor calls `GET /api/services` with optional query values. The route validates them, and the controller passes the filters here.
2. Begin with services that are active, have an active category, and belong to a technician whose account is active.
3. If a category ID was supplied, require that category ID too.
4. If a location was supplied, require a technician location containing that text, ignoring letter case.
5. If minimum or maximum price was supplied, add those price limits.

**Find services and ratings**

1. Find matching services and include selected category and technician details. Sort newest first.
2. If no services match, return an empty list to the controller.
3. Ask the review table for the average rating and review count of the technicians in this service list. This is a **second database query**, not one query per service.
4. Put those rating results in a map keyed by technician profile ID.
5. Add each technician's average rating and review count to each service. Use zero when a technician has no reviews.

**Apply the remaining filter**

1. If `minRating` was supplied, keep only services whose technician average meets it.
2. Return the final list to the controller.

**Why rating is handled after the service query**

1. First learn which technician IDs belong to the matching services.
2. Then calculate ratings for those technicians and apply the rating filter in memory.
