import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const jwt = require("jsonwebtoken");

export const verifyTechnicianWorkspace = async (base, env) => {
  const db = new Client({ connectionString: env.DATABASE_URL });
  let serviceId;
  let slotId;
  await db.connect();
  try {
    const technicians = (await db.query(`SELECT t.id, t."userId" FROM technician_profiles t
      JOIN "User" u ON u.id=t."userId" WHERE u."activeStatus"='ACTIVE'
      AND u.email LIKE '%@repair-demo.fixitnow.example' ORDER BY t.id LIMIT 2`)).rows;
    assert.equal(technicians.length, 2);
    const roles = (await db.query(`SELECT DISTINCT ON (role) id,role FROM "User"
      WHERE "activeStatus"='ACTIVE' ORDER BY role,id`)).rows;
    const token = (id) => jwt.sign({ id }, env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
    const owner = token(technicians[0].userId);
    const other = token(technicians[1].userId);
    const admin = token(roles.find(row => row.role === "ADMIN").id);
    const customer = token(roles.find(row => row.role === "CUSTOMER").id);
    const call = async (method, path, body, access = owner) => {
      const response = await fetch(`${base}${path}`, { method,
        headers: { "content-type": "application/json", ...(access ? { Authorization: `Bearer ${access}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, body: await response.json() };
    };
    for (const [access, status] of [[null, 401], [customer, 403]]) {
      assert.equal((await call("GET", "/api/technician/payments", null, access)).status, status);
      assert.equal((await call("GET", "/api/technician/services/suggestions?q=Fan", null, access)).status, status);
    }
    const suggestions = await call("GET", "/api/technician/services/suggestions?q=Fan");
    assert.equal(suggestions.status, 200);
    assert.ok(suggestions.body.data.length > 0);
    assert.equal((await call("GET", "/api/technician/services/suggestions?q=x")).status, 400);
    const categoryId = (await db.query('SELECT id FROM categories WHERE "isActive"=true LIMIT 1')).rows[0].id;
    const title = `QA technician service ${randomUUID()}`;
    const created = await call("POST", "/api/technician/services", {
      title, categoryId, description: "Temporary workspace regression fixture", price: "750.00", durationMinutes: 45,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    serviceId = created.body.data.id;
    const servicePath = `/api/technician/services/${serviceId}`;
    const adminPath = `/api/admin/services/${serviceId}`;
    const flags = async () => (await db.query('SELECT "isApproved","isActive","isCancelled","isAdminPaused" FROM services WHERE id=$1', [serviceId])).rows[0];
    const visible = async () => (await call("GET", `/api/services?q=${encodeURIComponent(title)}`, null, null)).body.data.some(row => row.id === serviceId);
    assert.equal((await flags()).isApproved, false);
    assert.equal(await visible(), false);
    assert.equal((await call("PATCH", servicePath, { action: "resume" })).status, 409);
    assert.equal((await call("PATCH", servicePath, { action: "cancel" }, other)).status, 404);
    assert.equal((await call("PATCH", adminPath, { action: "approve" }, owner)).status, 403);
    assert.equal((await call("PATCH", adminPath, { action: "approve" }, admin)).status, 200);
    assert.equal(await visible(), true);
    assert.equal((await call("PATCH", servicePath, { action: "pause" })).status, 200);
    assert.equal(await visible(), false);
    assert.equal((await call("PATCH", servicePath, { action: "resume" })).status, 200);
    assert.equal((await call("PATCH", adminPath, { action: "pause" }, admin)).status, 200);
    assert.equal((await flags()).isAdminPaused, true);
    assert.equal((await call("PATCH", servicePath, { action: "resume" })).status, 409);
    assert.equal((await call("PATCH", servicePath, { isActive: true })).status, 409);
    const profile = await call("GET", "/api/technician/profile");
    assert.equal(profile.body.data.services.find(row => row.id === serviceId).isAdminPaused, true);
    assert.equal((await call("PATCH", adminPath, { action: "resume" }, admin)).status, 200);
    assert.equal((await flags()).isAdminPaused, false);
    assert.equal(await visible(), true);
    assert.equal((await call("PATCH", servicePath, { title: `${title} edited` })).status, 200);
    assert.equal((await flags()).isApproved, false);
    assert.equal((await flags()).isActive, false);
    assert.equal((await call("PATCH", adminPath, { action: "reject" }, admin)).status, 200);
    assert.equal((await call("PATCH", adminPath, { isApproved: true }, admin)).status, 200);
    assert.equal((await call("PATCH", servicePath, { action: "cancel" })).status, 200);
    assert.equal((await flags()).isCancelled, true);
    assert.equal((await call("PATCH", adminPath, { action: "approve" }, admin)).status, 404);
    const paidTechnician = (await db.query(`SELECT t.id,t."userId" FROM technician_profiles t
      JOIN "User" u ON u.id=t."userId" WHERE u."activeStatus"='ACTIVE'
      AND EXISTS(SELECT 1 FROM services s JOIN bookings b ON b."serviceId"=s.id
        JOIN payments p ON p."bookingId"=b.id WHERE s."technicianProfileId"=t.id)
      ORDER BY t.id LIMIT 1`)).rows[0] ?? technicians[0];
    const payments = await call("GET", "/api/technician/payments", null, token(paidTechnician.userId));
    assert.equal(payments.status, 200);
    const expected = (await db.query(`SELECT p.id, ROUND(p.amount * 0.85, 2)::text AS share FROM payments p
      JOIN bookings b ON b.id=p."bookingId" JOIN services s ON s.id=b."serviceId"
      WHERE s."technicianProfileId"=$1`, [paidTechnician.id])).rows;
    assert.deepEqual(payments.body.data.map(row => row.id).sort(), expected.map(row => row.id).sort());
    for (const payment of payments.body.data) assert.equal(payment.technicianShare, expected.find(row => row.id === payment.id).share);
    const latest = (await db.query('SELECT MAX("endAt") AS latest FROM availability_slots WHERE "technicianProfileId"=$1', [technicians[0].id])).rows[0].latest;
    const startAt = new Date(Math.max(Date.now(), latest ? +new Date(latest) : 0) + 86400000).toISOString();
    const endAt = new Date(Date.parse(startAt) + 3600000).toISOString();
    assert.equal((await call("PUT", "/api/technician/availability", { slots: [{ startAt, endAt }] })).status, 200);
    slotId = (await db.query('SELECT id FROM availability_slots WHERE "technicianProfileId"=$1 AND "startAt"=$2', [technicians[0].id, startAt])).rows[0].id;
    assert.equal((await call("PATCH", `/api/technician/availability/${slotId}/block`, null, other)).status, 409);
    assert.equal((await call("PATCH", `/api/technician/availability/${slotId}/block`)).status, 200);
    return "PASS technician workspace: suggestions, submission, approval, ownership, technician/admin pause, reapproval, cancellation, payment shares and availability";
  } finally {
    if (slotId) await db.query('DELETE FROM availability_slots a WHERE id=$1 AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b."availabilitySlotId"=a.id)', [slotId]);
    if (serviceId) await db.query('DELETE FROM services s WHERE id=$1 AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b."serviceId"=s.id) AND NOT EXISTS(SELECT 1 FROM booking_items i WHERE i."serviceId"=s.id)', [serviceId]);
    await db.end();
  }
};

if (typeof process !== "undefined" && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv.includes("--run-live")) throw new Error("Pass --run-live to create and remove temporary service and availability fixtures.");
  const env = require("dotenv").parse(readFileSync(new URL("../.env", import.meta.url)));
  console.log(await verifyTechnicianWorkspace(process.env.TEST_API_BASE_URL ?? `http://127.0.0.1:${env.PORT}`, env));
}
