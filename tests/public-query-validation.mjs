import assert from "node:assert/strict";

import { serviceValidation } from "../src/modules/service/service.validation.ts";
import { technicianValidation } from "../src/modules/technician/technician.validation.ts";

const services = serviceValidation.getServicesQuerySchema.parse({
  q: "  repair  ", priceSort: "asc", ratingSort: "desc", minRating: "4.5", minPrice: "100.00", maxPrice: "500.00",
});
assert.equal(services.q, "repair");
assert.equal(services.minRating, 4.5);
assert.equal(services.priceSort, "asc");
assert.equal(services.ratingSort, "desc");

const technicians = technicianValidation.getTechniciansQuerySchema.parse({
  q: "  fan  ", page: "2", limit: "9", priceSort: "desc", minRating: "4", minPrice: "100", maxPrice: "800",
});
assert.equal(technicians.q, "fan");
assert.equal(technicians.page, 2);
assert.equal(technicians.limit, 9);
assert.equal(technicians.minRating, 4);

assert.equal(technicianValidation.getTechniciansQuerySchema.safeParse({ page: "0" }).success, false);
assert.equal(technicianValidation.getTechniciansQuerySchema.safeParse({ limit: "10" }).success, false);
assert.equal(technicianValidation.getTechniciansQuerySchema.safeParse({ priceSort: "random" }).success, false);
assert.equal(technicianValidation.getTechniciansQuerySchema.safeParse({ minPrice: "500", maxPrice: "100" }).success, false);
assert.equal(serviceValidation.getServicesQuerySchema.safeParse({ q: "x".repeat(101) }).success, false);

console.log("PASS public search, sort, filter, and pagination validation");
