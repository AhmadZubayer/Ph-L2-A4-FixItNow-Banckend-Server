import express, { Router } from "express";
import { stripeController } from "./stripe.controller";

export const stripeWebhookRoutes = Router();

stripeWebhookRoutes.post(
  "/",
  express.raw({ type: "application/json" }),
  stripeController.handleStripeWebhook,
);
