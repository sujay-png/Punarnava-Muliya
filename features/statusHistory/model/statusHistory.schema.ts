import { z } from "zod";

export const StatusHistorySchema = z.object({
  id: z.string().optional(),
  stayId: z.string(),
  from: z.string(),
  to: z.string(),
  changedAt: z.date(),
  changedBy: z.string(),
  note: z.string().optional(),
});
export type StatusHistory = z.infer<typeof StatusHistorySchema>;
