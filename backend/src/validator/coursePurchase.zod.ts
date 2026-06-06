import z, { any } from "zod";
import { PaymentStatus } from "../models/coursePurchase.model.js";

export const coursePurchaseSchema = z.object({
  course: z.string({ error: "Course reference is required" }),
  user: z.string({ error: "User reference is required" }),
  amount: z
    .number({ error: "Course purchase amount is required" })
    .min(0, { error: "Amount must be non-negative" }),
  currency: z
    .string({ error: "Currency of amount required" })
    .toUpperCase()
    .default("RUPEES"),
  status: z
    .enum(PaymentStatus, { error: "Please select a valid transaction status" })
    .default(PaymentStatus.PENDING),
  paymentMethod: z.string({ error: "Payment method is required" }),
  paymentId: z.string({ error: "Payment id is required" }),
  refundId: z.string().optional(),
  refundAmount: z
    .number()
    .min(0, { error: "Amount must be non-negative" })
    .optional(),
  refundReason: z.string().optional(),
  metadata: z.map(z.string(), z.string()).optional(),
});

export const webhookEventSchema = z.object({
  metadata: z.object({
    courseId: z.string({ error: "Course ID is required in metadata" }),
    userId: z.string({ error: "User ID is required in metadata" }),
  }),
  amount_total: z.number({ error: "Amount total is required" }),
  currency: z.string({ error: "Currency is required" }),
  payment_method_types: z
    .array(z.string())
    .min(1, { message: "At least one payment method type is required" }),
  id: z.string({ error: "Payment ID is required" }),
});

export {
  coursePurchaseSchema as coursePurchaseValidator,
  webhookEventSchema as stripeWebhookEventValidator,
};
