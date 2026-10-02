import { z } from "zod";

export const StayStatusEnum = z.enum(["Active", "OnNotice", "Vacated"]);
export type StayStatus = z.infer<typeof StayStatusEnum>;

export const StaySchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  roomNumber: z.string(),
  bedNo: z.string().optional(),
  joinDate: z.date(),
  noticeDate: z.date().nullable().optional(),
  expectedVacateDate: z.date().nullable().optional(),
  vacateDate: z.date().nullable().optional(),
  monthlyRent: z.number().min(0),
  status: StayStatusEnum.default("Active"),
  vacateNotes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Stay = z.infer<typeof StaySchema>;
