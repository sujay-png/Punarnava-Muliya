import { z } from "zod";
import { PaymentSchema as LegacyPaymentSchema } from "@/lib/models/schema";

export const PaymentStatusEnum = z.enum(["Paid", "Pending", "Overdue", "Partial", "N/A"]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const PaymentSchema = z.object({
  id: z.string().optional(),
  stayId: z.string().optional(), // Optional for now to not break existing data immediately
  tenantId: z.string(),
  tenantName: z.string(),
  roomNo: z.string(),
  monthKey: z.string().optional(), // Kept for backwards compatibility
  month: z.string().optional(), // YYYY-MM
  amount: z.number().optional(), // Kept for backwards compat
  rent: z.number().default(0),
  fine: z.number().default(0),
  amountPaid: z.number().default(0),
  status: PaymentStatusEnum.default("Pending"),
  paidOn: z.date().nullable().optional(),
  mode: z.enum(["cash", "upi", "bank"]).optional(),
  receiptNo: z.string().optional(),
  // Legacy fields below:
  paidAt: z.date().nullable().optional(), 
  couponUsed: z.string().nullable().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;
