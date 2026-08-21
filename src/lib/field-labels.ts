/**
 * Maps schema field names to the wording the user actually sees on the form, so
 * a validation message can name the field instead of echoing a camelCase key.
 */
export const fieldLabels: Record<string, string> = {
  // Report
  projectId: "Project",
  weekStart: "Week start",
  weekEnd: "Week end",
  summary: "Summary",
  blocker: "Blocker",
  nextWeekPlan: "Next week plan",
  notes: "Notes",
  totalTestCase: "Test case total",
  totalTcExecuted: "TC executed",
  totalTcBE: "Test case BE total",
  totalTcBEAutomated: "BE automated",
  totalTcBEPassed: "BE passed",
  totalTcBEFailed: "BE failed",
  totalTcFE: "Test case FE total",
  totalTcFEAutomated: "FE automated",
  totalTcFEPassed: "FE passed",
  totalTcFEFailed: "FE failed",
  productionIncidentCount: "Jumlah production incident",
  bugDocumentUrl: "Bug document URL",
  bugs: "Production incident",
  coAuthorUserIds: "Co-author",

  // Project
  name: "Nama",
  code: "Code project",
  description: "Deskripsi",
  startDate: "Tanggal mulai",
  endDate: "Tanggal berakhir",
  status: "Status",
  assignedUserIds: "QA assigned",

  // User & profile
  email: "Email",
  password: "Password",
  role: "Role",
  currentPassword: "Password saat ini",
  newPassword: "Password baru",
  confirmPassword: "Konfirmasi password baru",

  // Review
  action: "Aksi review",
  note: "Catatan revisi",
};

export function labelFor(field: string) {
  return fieldLabels[field] ?? field;
}

/**
 * Prefixes the field name only when the message doesn't already say it, so a
 * rule like "TC executed tidak boleh melebihi..." isn't read back as
 * "TC executed: TC executed tidak boleh melebihi...".
 */
export function describeFieldError(field: string, message: string) {
  const label = labelFor(field);
  return message.toLowerCase().includes(label.toLowerCase())
    ? message
    : `${label}: ${message}`;
}
