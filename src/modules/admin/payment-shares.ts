import { Prisma } from "../../../generated/prisma/client";
import { PaymentStatus } from "../../../generated/prisma/enums";

export const calculatePaymentShares = (amount: Prisma.Decimal, status: PaymentStatus) => {
    if (status !== PaymentStatus.COMPLETED) {
        return { technicianReceived: new Prisma.Decimal(0), platformEarning: new Prisma.Decimal(0) };
    }

    const technicianReceived = amount.mul("0.85").toDecimalPlaces(2);
    return { technicianReceived, platformEarning: amount.minus(technicianReceived) };
};
