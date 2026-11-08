import assert from "node:assert/strict";

import { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "../src/lib/prisma.ts";
import { serviceService } from "../src/modules/service/service.service.ts";
import { technicianService } from "../src/modules/technician/technician.service.ts";

const originalServices = prisma.service.findMany;
const originalTechnicians = prisma.technicianProfile.findMany;
const originalTechnician = prisma.technicianProfile.findFirst;
const originalRatings = prisma.review.groupBy;
const categoryId = "11111111-1111-4111-8111-111111111111";
const serviceId = "22222222-2222-4222-8222-222222222222";

try {
  let serviceQuery;
  prisma.service.findMany = async (query) => {
    serviceQuery = query;
    return [
      { id: "s1", price: new Prisma.Decimal("100"), createdAt: new Date("2026-01-01"), technicianProfileId: "t1", technicianProfile: { id: "t1" } },
      { id: "s2", price: new Prisma.Decimal("200"), createdAt: new Date("2026-01-02"), technicianProfileId: "t2", technicianProfile: { id: "t2" } },
      { id: "s3", price: new Prisma.Decimal("150"), createdAt: new Date("2026-01-03"), technicianProfileId: "t3", technicianProfile: { id: "t3" } },
    ];
  };
  prisma.review.groupBy = async () => [
    { technicianProfileId: "t1", _avg: { rating: 5 }, _count: { rating: 2 } },
    { technicianProfileId: "t2", _avg: { rating: 3 }, _count: { rating: 2 } },
    { technicianProfileId: "t3", _avg: { rating: 4.5 }, _count: { rating: 2 } },
  ];

  const services = await serviceService.getAllServicesFromDB({ q: "fan", categoryId, minPrice: "50", minRating: 4.5, priceSort: "desc" });
  assert.deepEqual(services.map((service) => service.id), ["s3", "s1"]);
  assert.equal(serviceQuery.where.category.id, categoryId);
  assert.equal(serviceQuery.where.price.gte, "50");
  assert.equal(serviceQuery.where.OR[0].title.contains, "fan");

  let technicianQuery;
  prisma.technicianProfile.findMany = async (query) => {
    technicianQuery = query;
    return Array.from({ length: 12 }, (_, index) => ({
      id: `t${index + 1}`, user: { name: `Technician ${String(index + 1).padStart(2, "0")}` },
      services: [{ id: `s${index + 1}`, price: new Prisma.Decimal(String(100 + index * 10)) }],
    }));
  };
  prisma.review.groupBy = async () => [];

  const result = await technicianService.getAllTechniciansFromDB({
    q: "fan", categoryId, serviceId, minPrice: "100", page: 2, limit: 9, priceSort: "desc",
  });
  assert.deepEqual(result.meta, { page: 2, limit: 9, total: 12 });
  assert.deepEqual(result.technicians.map((technician) => technician.id), ["t3", "t2", "t1"]);
  assert.equal(technicianQuery.where.services.some.id, serviceId);
  assert.equal(technicianQuery.where.services.some.categoryId, categoryId);
  assert.equal(technicianQuery.where.services.some.price.gte, "100");
  assert.equal(technicianQuery.where.OR[2].services.some.title.contains, "fan");
  assert.equal(technicianQuery.select.services.where.id, serviceId);

  let profileQuery;
  prisma.technicianProfile.findFirst = async (query) => {
    profileQuery = query;
    return { id: "t1", reviews: [], availabilitySlots: [
      { id: "open", isActive: true, bookings: [] },
      { id: "booked", isActive: false, bookings: [{ status: "REQUESTED" }] },
    ] };
  };
  const profile = await technicianService.getTechnicianByIdFromDB("t1");
  assert.deepEqual(profile.availabilitySlots.map((slot) => slot.id), ["open", "booked"]);
  assert.equal(profileQuery.select.availabilitySlots.where.OR[0].isActive, true);
  assert.deepEqual(profileQuery.select.availabilitySlots.where.OR[1].bookings.some.status.in, ["REQUESTED", "ACCEPTED", "PAID", "IN_PROGRESS"]);
  assert.equal(profileQuery.select.availabilitySlots.select.isActive, true);
  assert.equal(profileQuery.select.availabilitySlots.select.bookings.select.status, true);

  console.log("PASS public query data, page metadata, and visible booked slots");
} finally {
  prisma.service.findMany = originalServices;
  prisma.technicianProfile.findMany = originalTechnicians;
  prisma.technicianProfile.findFirst = originalTechnician;
  prisma.review.groupBy = originalRatings;
}
