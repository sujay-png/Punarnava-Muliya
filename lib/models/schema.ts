import { z } from "zod";

// --- Tenant ---
export const TenantStatusEnum = z.enum(["active", "notice", "vacated"]);
export type TenantStatus = z.infer<typeof TenantStatusEnum>;

export const TenantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Full name is required"),
  roomNo: z.string().optional().or(z.literal("")),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  joinDate: z.date(),
  monthlyRent: z.preprocess(
    (val) => {
      if (val === "" || Number.isNaN(val)) return 0;
      if (typeof val === "string") return parseFloat(val) || 0;
      return val;
    },
    z.number().min(1, "Monthly rent must be greater than 0")
  ),
  idProofType: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const v = val.toLowerCase();
      if (v === "aadhaar" || v === "aadhar") return "Aadhaar";
      if (v === "pan") return "PAN";
      return "Other";
    },
    z.enum(["Aadhaar", "PAN", "Other"])
  ),
  idNumber: z.string().min(1, "ID number is required"),
  emergencyContact: z.string().optional(),
  status: TenantStatusEnum.default("active"),
  expectedVacateDate: z.date().nullable().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dob: z.date().nullable().optional(),
  age: z.preprocess(
    (val) => {
      if (val === "" || Number.isNaN(val)) return null;
      if (typeof val === "string") return parseInt(val, 10) || null;
      return val;
    },
    z.number().nullable().optional()
  ),
  permanentAddress: z.string().optional(),
  nationality: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  maritalStatus: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const v = val.toLowerCase();
      if (v === "married") return "Married";
      return "Unmarried";
    },
    z.enum(["Married", "Unmarried"])
  ),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  occupationStatus: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const v = val.toLowerCase();
      if (v === "student") return "Student";
      if (v === "working professional" || v === "professional" || v === "working") return "Working Professional";
      if (v === "business owner" || v === "business") return "Business Owner";
      return "Student"; // Default fallback for old data
    },
    z.enum(["Student", "Working Professional", "Business Owner"])
  ),
  appointmentLetterRef: z.string().optional(),
  expectedStay: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleNumber: z.string().optional(),
  bloodGroup: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const v = val.toUpperCase();
      if (["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(v)) return v;
      return "O+"; // Fallback
    },
    z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
  ),
  healthCondition: z.string().optional(),
  signature: z.string().min(1, "Signature is required"),
  declarationDate: z.date().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

// --- Payment ---
export const PaymentStatusEnum = z.enum(["paid", "pending", "overdue"]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const PaymentSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  tenantName: z.string(),
  roomNo: z.string(),
  monthKey: z.string(), // e.g. "2026-07"
  amount: z.number(),
  status: PaymentStatusEnum.default("pending"),
  paidAt: z.date().nullable().optional(),
  couponUsed: z.string().nullable().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;

// --- Maintenance ---
export const MaintenanceStatusEnum = z.enum(["open", "in_progress", "resolved"]);
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusEnum>;

export const MaintenanceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Issue title is required"),
  category: z.enum(["Electrical", "Plumbing", "Furniture", "Other"]).default("Other"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  status: MaintenanceStatusEnum.default("open"),
  roomNo: z.string(),
  tenantName: z.string(),
  createdAt: z.date().optional(),
});

export type Maintenance = z.infer<typeof MaintenanceSchema>;

// --- Notice ---
export const NoticeStatusEnum = z.enum(["queued", "sent", "failed"]);
export type NoticeStatus = z.infer<typeof NoticeStatusEnum>;

export const NoticeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  broadcastStatus: NoticeStatusEnum.default("queued"),
  recipientCount: z.number().default(0),
  broadcastError: z.string().nullable().optional(),
  broadcastAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
});

export type Notice = z.infer<typeof NoticeSchema>;

// --- Product ---
export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
  offerText: z.string().optional(),
  orderLink: z.string().optional(),
  featured: z.boolean().default(false),
});

export type Product = z.infer<typeof ProductSchema>;
