import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const bulletListSchema = z
  .array(z.string())
  .transform((arr) => arr.map((s) => s.trim()).filter(Boolean));

export const bugSchema = z.object({
  title: z.string().min(1, "Judul incident wajib diisi"),
  description: z.string().optional().default(""),
  link: z
    .union([z.string().url("Link incident tidak valid"), z.literal("")])
    .optional()
    .default(""),
});

const draftBugSchema = z.object({
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  link: z.string().optional().default(""),
});

const reportShape = {
  projectId: z.string().min(1, "Project wajib dipilih"),
  weekStart: z.coerce.date(),
  weekEnd: z.coerce.date(),
  notes: z.string().optional().default(""),
  totalTestCase: z.coerce.number().int().min(0),
  totalTcExecuted: z.coerce.number().int().min(0),
  totalTcBE: z.coerce.number().int().min(0),
  totalTcBEAutomated: z.coerce.number().int().min(0),
  totalTcBEPassed: z.coerce.number().int().min(0),
  totalTcBEFailed: z.coerce.number().int().min(0),
  totalTcFE: z.coerce.number().int().min(0),
  totalTcFEAutomated: z.coerce.number().int().min(0),
  totalTcFEPassed: z.coerce.number().int().min(0),
  totalTcFEFailed: z.coerce.number().int().min(0),
  productionIncidentCount: z.coerce.number().int().min(0),
  bugDocumentUrl: z
    .union([z.string().url("Bug document URL tidak valid"), z.literal("")])
    .optional()
    .default(""),
  coAuthorUserIds: z.array(z.string()).default([]),
};

export const reportSchema = z
  .object({
    ...reportShape,
    summary: bulletListSchema.refine((arr) => arr.length > 0, {
      message: "Minimal 1 poin summary",
    }),
    blocker: bulletListSchema,
    nextWeekPlan: bulletListSchema.refine((arr) => arr.length > 0, {
      message: "Minimal 1 poin next week plan",
    }),
    bugs: z.array(bugSchema).default([]),
  })
  .refine((data) => data.weekEnd >= data.weekStart, {
    message: "Tanggal akhir harus setelah tanggal mulai",
    path: ["weekEnd"],
  })
  .refine((data) => data.totalTcBE + data.totalTcFE >= data.totalTestCase, {
    message: "Total BE + FE harus sama atau lebih besar dari jumlah total",
    path: ["totalTestCase"],
  })
  .refine((data) => data.totalTcExecuted <= data.totalTestCase, {
    message: "TC executed tidak boleh melebihi total TC project",
    path: ["totalTcExecuted"],
  })
  .refine((data) => data.totalTcBEAutomated <= data.totalTcBE, {
    message: "TC BE automated tidak boleh melebihi total TC BE",
    path: ["totalTcBEAutomated"],
  })
  .refine((data) => data.totalTcFEAutomated <= data.totalTcFE, {
    message: "TC FE automated tidak boleh melebihi total TC FE",
    path: ["totalTcFEAutomated"],
  })
  .refine(
    (data) => data.totalTcBEPassed + data.totalTcBEFailed <= data.totalTcBEAutomated,
    {
      message: "Passed + Failed BE tidak boleh melebihi total automation BE",
      path: ["totalTcBEPassed"],
    }
  )
  .refine(
    (data) => data.totalTcFEPassed + data.totalTcFEFailed <= data.totalTcFEAutomated,
    {
      message: "Passed + Failed FE tidak boleh melebihi total automation FE",
      path: ["totalTcFEPassed"],
    }
  );

export const reportDraftSchema = z
  .object({
    ...reportShape,
    summary: bulletListSchema,
    blocker: bulletListSchema,
    nextWeekPlan: bulletListSchema,
    bugs: z.array(draftBugSchema).default([]),
  })
  .refine((data) => data.weekEnd >= data.weekStart, {
    message: "Tanggal akhir harus setelah tanggal mulai",
    path: ["weekEnd"],
  });

export const startReportSchema = z
  .object({
    projectId: z.string().min(1, "Project wajib dipilih"),
    weekStart: z.coerce.date(),
    weekEnd: z.coerce.date(),
  })
  .refine((data) => data.weekEnd >= data.weekStart, {
    message: "Tanggal akhir harus setelah tanggal mulai",
    path: ["weekEnd"],
  });

export const userCreateSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "QA"]),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["ADMIN", "QA"]),
  password: z
    .union([z.string().min(6, "Password minimal 6 karakter"), z.literal("")])
    .optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Nama project wajib diisi"),
  code: z
    .string()
    .min(1, "Code project wajib diisi")
    .max(20, "Code maksimal 20 karakter")
    .regex(/^[A-Za-z0-9-]+$/, "Code hanya boleh huruf, angka, dan tanda -")
    .transform((v) => v.toUpperCase()),
  description: z.string().optional().default(""),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  status: z.enum(["ACTIVE", "ON_HOLD", "DONE"]),
  assignedUserIds: z.array(z.string()).default([]),
});

export const reviewActionSchema = z.object({
  action: z.enum(["APPROVED", "NEED_REVISION"]),
  note: z.string().optional().default(""),
});

export const profileUpdateSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi"),
    currentPassword: z.string().optional().default(""),
    newPassword: z
      .union([z.string().min(6, "Password minimal 6 karakter"), z.literal("")])
      .optional()
      .default(""),
  })
  .refine((data) => !data.newPassword || data.currentPassword, {
    message: "Masukkan password saat ini untuk mengganti password",
    path: ["currentPassword"],
  });
