import { z } from "zod";
import { listModerationServices, moderateService } from "../service/service-moderation";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/appError";

const decisionSchema = z.union([
    z.object({ action: z.enum(["approve", "reject", "pause", "resume", "delete"]) }).strict(),
    z.object({ isApproved: z.boolean() }).strict(),
]);

export const adminServices = catchAsync(async (_req, res) => {
    res.json({ data: await listModerationServices() });
});

export const approveService = catchAsync(async (req, res) => {
    const id = z.uuid().safeParse(req.params.id);
    const body = decisionSchema.safeParse(req.body);
    if (!id.success || !body.success) throw new AppError(400, "Provide a valid service ID and moderation action");
    const action = "action" in body.data ? body.data.action : body.data.isApproved ? "approve" : "reject";
    res.json({ data: await moderateService(id.data, action) });
});
