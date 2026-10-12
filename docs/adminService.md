# Admin service methods

Source: [admin.service.ts](../src/modules/admin/admin.service.ts)

## Methods and their purpose

- **`getAllUsersFromDB`** — Lists users with safe public account fields.
- **`updateUserStatusIntoDB`** — Activates or blocks a user. **Critical: prevents an admin from blocking their own account.**
- **`getAllBookingsFromDB`** — Lists every booking with customer, service, and technician details.

## Method flows

### 1. `getAllUsersFromDB`

1. **Start:** An admin calls `GET /api/admin/users`. Authentication checks the admin role, and the controller calls this method.
2. Find all users.
3. Select ID, name, email, role, active status, and timestamps. Do **not** select password hashes.
4. Sort newest users first.
5. Return the list to the controller.

### 2. `updateUserStatusIntoDB` — **CRITICAL: self-block rule**

**Check the request**

1. **Start:** An admin calls `PATCH /api/admin/users/:id`. Authentication supplies the admin's ID. Validation supplies the target user's ID and the requested `ACTIVE` or `BLOCKED` status.
2. The controller passes all three values to this method.
3. If the target ID is the admin's own ID **and** the requested status is `BLOCKED`, stop with “You cannot block your own account.”

**Update the user**

1. Update the target user's `activeStatus` in the database.
2. If the user ID does not exist, return “User not found.”
3. Select safe account fields without the password hash.
4. Return the updated user to the controller.

### 3. `getAllBookingsFromDB`

1. **Start:** An admin calls `GET /api/admin/bookings`. Authentication checks the admin role, and the controller calls this method.
2. Find every booking, with no customer filter.
3. Select booking status, time, saved price, customer details, service details, and technician details.
4. Sort newest bookings first.
5. Return the list to the controller.
