import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/appError";
import { bookingItems } from "../booking/booking-items";

export const technicianPayments = catchAsync(async (req, res) => {
  const rows = await prisma.payment.findMany({
    where: { booking: { service: { technicianProfile: { userId: req.user!.id } } } },
    select: { id: true, amount: true, status: true, provider: true, createdAt: true, updatedAt: true, paidAt: true,
      booking: { select: { id: true, items: bookingItems, customer: { select: { name: true } }, service: { select: { title: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: rows.map(row => ({ ...row, technicianShare: row.amount.mul("0.85").toFixed(2) })) });
});

export const serviceSuggestions = catchAsync(async (req, res) => {
  const result = z.string().trim().min(2).max(100).safeParse(req.query.q);
  if (!result.success) throw new AppError(400, "Enter 2 to 100 characters");
  const rows = await prisma.service.findMany({ where: { title: { contains: result.data, mode: "insensitive" }, isActive: true, category: { isActive: true } },
    select: { title: true, categoryId: true }, distinct: ["title", "categoryId"], orderBy: { title: "asc" }, take: 20 });
  res.json({ data: rows });
});

