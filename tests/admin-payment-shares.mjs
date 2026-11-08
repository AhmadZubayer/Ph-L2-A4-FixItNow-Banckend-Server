import assert from "node:assert/strict";

import { Prisma } from "../generated/prisma/client.ts";
import { PaymentStatus } from "../generated/prisma/enums.ts";
import { calculatePaymentShares } from "../src/modules/admin/payment-shares.ts";

const completed = calculatePaymentShares(new Prisma.Decimal("100.00"), PaymentStatus.COMPLETED);
assert.equal(completed.technicianReceived.toFixed(2), "85.00");
assert.equal(completed.platformEarning.toFixed(2), "15.00");

const rounded = calculatePaymentShares(new Prisma.Decimal("0.01"), PaymentStatus.COMPLETED);
assert.equal(rounded.technicianReceived.toFixed(2), "0.01");
assert.equal(rounded.platformEarning.toFixed(2), "0.00");
assert.equal(rounded.technicianReceived.plus(rounded.platformEarning).toFixed(2), "0.01");

for (const status of [PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.REFUNDED]) {
    const shares = calculatePaymentShares(new Prisma.Decimal("100.00"), status);
    assert.equal(shares.technicianReceived.toFixed(2), "0.00");
    assert.equal(shares.platformEarning.toFixed(2), "0.00");
}

console.log("PASS completed and unrealized payment shares");
