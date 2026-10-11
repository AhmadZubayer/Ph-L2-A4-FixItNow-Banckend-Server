import express, { Router } from "express";
import { stripeController } from "./stripe.controller";

export const stripeWebhookRoutes = Router();

stripeWebhookRoutes.post(
  "/",
  express.raw({ type: "application/json" }),
  stripeController.handleStripeWebhook,
);

export const stripeReturnRoutes = Router();

stripeReturnRoutes.get("/success", stripeController.showSuccessReturn);
stripeReturnRoutes.get("/cancel", stripeController.showCancelReturn);
