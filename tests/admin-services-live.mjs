import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const env = require("dotenv").parse(readFileSync(new URL("../.env", import.meta.url)));
if (!process.argv.includes("--run-live")) throw new Error("Pass --run-live to create and remove one temporary service in the configured database.");
const db = new Client({ connectionString: env.DATABASE_URL });
const id = randomUUID();
const title = `Ceiling Fan Safety Inspection ${id.slice(0, 8)}`;
let inserted = false;
await db.connect();
try {
  const identities = (await db.query('SELECT DISTINCT ON (role) id,role FROM "User" WHERE "activeStatus"=\'ACTIVE\' ORDER BY role,id')).rows;
  const token = (role) => { const user = identities.find((row) => row.role === role); assert.ok(user); return jwt.sign({ id: user.id }, env.JWT_ACCESS_SECRET, { expiresIn: "5m" }); };
  const admin = token("ADMIN");
  const customer = token("CUSTOMER");
  const technician = token("TECHNICIAN");
  const sample = (await db.query('SELECT s."technicianProfileId",s."categoryId" FROM services s JOIN technician_profiles t ON t.id=s."technicianProfileId" JOIN "User" u ON u.id=t."userId" WHERE u.email LIKE $1 LIMIT 1', ["%@repair-demo.fixitnow.example"])).rows[0];
  assert.ok(sample, "An existing demo technician service is required");
  await db.query('INSERT INTO services(id,title,description,price,"durationMinutes","isActive","isApproved","isCancelled","technicianProfileId","categoryId","createdAt","updatedAt") VALUES($1,$2,$3,750,45,false,false,false,$4,$5,NOW(),NOW())', [id, title, "Inspection and adjustment of fan mounting, wiring and controls.", sample.technicianProfileId, sample.categoryId]);
  inserted = true;
  const call = async (method, path, body, access = admin) => {
    const response = await fetch(`${process.env.TEST_API_BASE_URL ?? `http://127.0.0.1:${env.PORT}`}${path}`, { method, headers: { ...(access ? { Authorization: `Bearer ${access}` } : {}), "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  for (const [access, status] of [[null, 401], [customer, 403], [technician, 403]]) {
    assert.equal((await call("GET", "/api/admin/services", null, access)).status, status);
    assert.equal((await call("PATCH", `/api/admin/services/${id}`, { action: "approve" }, access)).status, status);
  }
  const initial = await call("GET", "/api/admin/services");
  assert.equal(initial.status, 200);
  assert.ok(initial.body.data.some((service) => service.id === id && !service.isApproved));
  const visible = async () => (await call("GET", `/api/services?q=${encodeURIComponent(title)}`)).body.data.some((service) => service.id === id);
  assert.equal(await visible(), false);
  assert.equal((await call("PATCH", `/api/admin/services/${id}`, { action: "resume" })).status, 409);
  for (const action of ["approve", "pause", "resume", "reject", "approve"]) {
    const response = await call("PATCH", `/api/admin/services/${id}`, { action });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.data.id, id);
    assert.equal(response.body.data.isAdminPaused, action === "pause");
    assert.equal(await visible(), ["approve", "resume"].includes(action));
  }
  assert.equal((await call("PATCH", `/api/admin/services/${id}`, { isApproved: false })).status, 200);
  assert.equal(await visible(), false, "Existing approval payload remains supported");
  assert.equal((await call("PATCH", `/api/admin/services/${id}`, { action: "delete" })).status, 200);
  assert.equal((await call("GET", "/api/admin/services")).body.data.some((service) => service.id === id), false);
  assert.equal(await visible(), false);
  const preserved = (await db.query('SELECT "isCancelled","isActive" FROM services WHERE id=$1', [id])).rows[0];
  assert.equal(preserved.isCancelled, true);
  assert.equal(preserved.isActive, false);
  assert.equal((await call("PATCH", `/api/admin/services/${id}`, { action: "approve" })).status, 404);
  assert.equal((await call("PATCH", "/api/admin/services/not-an-id", { action: "approve" })).status, 400);
  assert.equal((await call("PATCH", `/api/admin/services/${id}`, { action: "unknown" })).status, 400);
  console.log("PASS live admin service authorization, approve/reject, pause/resume, public visibility, soft deletion, compatibility, and validation");
} finally {
  if (inserted) await db.query('DELETE FROM services s WHERE id=$1 AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b."serviceId"=s.id) AND NOT EXISTS(SELECT 1 FROM booking_items i WHERE i."serviceId"=s.id)', [id]);
  await db.end();
}
