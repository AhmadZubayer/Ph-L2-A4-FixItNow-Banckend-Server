import assert from "node:assert/strict";

import { Prisma } from "../generated/prisma/client.ts";
import { PaymentStatus } from "../generated/prisma/enums.ts";
import { prisma } from "../src/lib/prisma.ts";
import { adminService } from "../src/modules/admin/admin.service.ts";

const originalFindMany = prisma.payment.findMany;

try {
  let query;
  prisma.payment.findMany = async (options) => {
    query = options;
    return [
      { id: "paid", amount: new Prisma.Decimal("200.00"), status: PaymentStatus.COMPLETED, booking: { customer: { name: "Customer" }, service: { title: "Repair", technicianProfile: { user: { name: "Technician" } } } } },
      { id: "refunded", amount: new Prisma.Decimal("100.00"), status: PaymentStatus.REFUNDED, booking: { customer: { name: "Customer" }, service: { title: "Repair", technicianProfile: { user: { name: "Technician" } } } } },
    ];
  };

  const payments = await adminService.getAllPaymentsFromDB();
  assert.equal(payments.length, 2);
  assert.equal(payments[0].technicianReceived.toFixed(2), "170.00");
  assert.equal(payments[0].platformEarning.toFixed(2), "30.00");
  assert.equal(payments[1].technicianReceived.toFixed(2), "0.00");
  assert.equal(payments[1].platformEarning.toFixed(2), "0.00");
  assert.equal(query.select.booking.select.service.select.technicianProfile.select.user.select.name, true);
  assert.equal(query.orderBy.createdAt, "desc");
  console.log("PASS admin payment history data and realized shares");
} finally {
  prisma.payment.findMany = originalFindMany;
}
