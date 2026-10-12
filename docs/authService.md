# Auth service methods

Source: [auth.services.ts](../src/modules/auth/auth.services.ts)

## Methods and their purpose

- **`registerUserIntoDB`** — Creates a customer or technician account with a hashed password. **Critical: password hashing.**
- **`loginUser`** — Checks credentials and gives the user access and refresh tokens. **Critical: password check and token creation.**
- **`refreshToken`** — Checks a refresh token and creates a new access token. **Critical: token verification.**
- **`updateProfileIntoDB`** — Changes the signed-in user's name or email.

## Method flows

### 1. `registerUserIntoDB` — **CRITICAL: password hashing**

**Input and checks**

1. **Start:** `POST /api/auth/register` sends a body to the auth route. Validation checks it, and the controller passes the cleaned body here.
2. Read the name, email, password, and role. Change the email to lowercase.
3. Find a user with that email. If one exists, stop with a conflict error.

**Save the account**

1. Hash the plain password with bcrypt and the configured salt rounds. The hash is what will be stored, not the plain password.
2. Create the user with the name, lowercase email, password hash, and role.
3. Omit `passwordHash` from the returned user.
4. Return the user to the controller, which sends the registration response.

### 2. `loginUser` — **CRITICAL: password check + JWT tokens**

**Check the credentials**

1. **Start:** `POST /api/auth/login` sends an email and password. Validation checks the body, and the controller passes it here.
2. Find the user by lowercase email. If no user exists, stop with “Invalid email or password.”
3. Ask bcrypt to compare the supplied password with the saved hash. If it does not match, stop with the same error.
4. If the account is `BLOCKED`, stop with a forbidden error.

**Create tokens**

1. Build a token payload from the user's ID, name, email, and role.
2. Sign an access token with the access secret and its configured expiry.
3. Sign a refresh token with the refresh secret and its configured expiry.
4. Return both tokens to the controller, which sends them in the login response.

### 3. `refreshToken` — **CRITICAL: token verification**

**Input and verification**

1. **Start:** `POST /api/auth/refresh-token` sends a refresh token in the request body. Validation checks the body, and the controller passes the token string here.
2. Verify its signature and expiry with the **refresh** secret. If verification fails or the decoded user ID is missing, stop.
3. Find the user from that decoded ID. If the user no longer exists, stop.
4. If the user is `BLOCKED`, stop.

**Create the replacement**

1. Build a fresh payload using the user's **current** details from the database.
2. Sign a new access token with the access secret and access expiry.
3. Return **only the new access token** to the controller. This method does not issue another refresh token.

### 4. `updateProfileIntoDB`

1. **Start:** The user calls `PATCH /api/auth/me`. Authentication supplies their user ID, and validation passes the name/email body to the controller.
2. The controller gives this method the user ID and validated body.
3. Update that user's name and/or email. Change a supplied email to lowercase.
4. Omit `passwordHash` from the returned user.
5. If the new email is already taken, return a conflict error. If the user no longer exists, return “User not found.”
6. Otherwise, return the updated user to the controller.
