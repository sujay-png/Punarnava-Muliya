import { z } from "zod";

export const DepositStatusEnum = z.enum(["Held", "PartiallyRefunded", "Refunded", "Forfeited"]);
export type DepositStatus = z.infer<typeof DepositStatusEnum>;

export const DepositDeductionSchema = z.object({
  label: z.string(),
  amount: z.number(),
  reason: z.string().optional(),
});
export type DepositDeduction = z.infer<typeof DepositDeductionSchema>;

export const DepositSchema = z.object({
  id: z.string().optional(),
  stayId: z.string(),
  tenantId: z.string(),
  amount: z.number().min(0),
  paidOn: z.date(),
  mode: z.enum(["cash", "upi", "bank"]),
  status: DepositStatusEnum.default("Held"),
  deductions: z.array(DepositDeductionSchema).default([]),
  refundAmount: z.number().optional(),
  refundedOn: z.date().nullable().optional(),
  refundMode: z.enum(["cash", "upi", "bank"]).optional(),
  refundRef: z.string().optional(),
});
export type Deposit = z.infer<typeof DepositSchema>;
