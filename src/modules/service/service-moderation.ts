import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";

// Parameterized SQL also supports servers running the pre-migration generated client.
export type ServiceFlags = { id: string; isApproved: boolean; isCancelled: boolean; isAdminPaused: boolean };
export const serviceFlags = (profileId: string) => prisma.$queryRaw<ServiceFlags[]>`
  SELECT id, "isApproved", "isCancelled", "isAdminPaused" FROM services WHERE "technicianProfileId" = ${profileId}`;

export const moderateService = async (id: string, action: "approve" | "reject" | "pause" | "resume" | "delete") => {
  await prisma.$transaction(async transaction => {
    const [row] = await transaction.$queryRaw<ServiceFlags[]>`SELECT id, "isApproved", "isCancelled", "isAdminPaused" FROM services WHERE id=${id} FOR UPDATE`;
    if (!row || row.isCancelled) throw new AppError(404, "Service not found or withdrawn");
    if ((action === "pause" || action === "resume") && !row.isApproved) throw new AppError(409, "Approve this service first");
    const approved = action === "approve" ? true : action === "reject" || action === "delete" ? false : row.isApproved;
    const paused = action === "pause";
    const active = (action === "approve" || action === "resume") && approved;
    await transaction.$executeRaw`UPDATE services SET "isApproved"=${approved}, "isAdminPaused"=${paused}, "isActive"=${active}, "isCancelled"=${action === "delete"}, "updatedAt"=NOW() WHERE id=${id}`;
  });
  return action === "delete" ? { id } : (await listModerationServices()).find(row => row.id === id);
};

export const listModerationServices = () => prisma.$queryRaw<Array<{ id: string; title: string; isApproved: boolean; isCancelled: boolean; isActive: boolean; isAdminPaused: boolean; technician: string }>>`
  SELECT s.id, s.title, s.price, s."isApproved", s."isCancelled", s."isActive", s."isAdminPaused", c.name AS category, u.name AS technician
  FROM services s JOIN categories c ON c.id=s."categoryId"
  JOIN technician_profiles t ON t.id=s."technicianProfileId" JOIN "User" u ON u.id=t."userId"
  WHERE s."isCancelled"=false ORDER BY s."isApproved" ASC, s."createdAt" DESC, s.id ASC`;
