"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readApiError, NETWORK_ERROR_MESSAGE } from "@/lib/api-client-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulletListEditor } from "@/components/reports/bullet-list-editor";
import { Trash2, Plus } from "lucide-react";

export type ProjectOption = { id: string; name: string };
export type QaUserOption = { id: string; name: string; email: string };

type BugRow = { title: string; description: string; link: string };

export type ReportFormValues = {
  projectId: string;
  weekStart: string;
  weekEnd: string;
  summary: string[];
  blocker: string[];
  nextWeekPlan: string[];
  notes: string;
  totalTestCase: string;
  totalTcExecuted: string;
  totalTcBE: string;
  totalTcBEAutomated: string;
  totalTcBEPassed: string;
  totalTcBEFailed: string;
  totalTcFE: string;
  totalTcFEAutomated: string;
  totalTcFEPassed: string;
  totalTcFEFailed: string;
  productionIncidentCount: string;
  bugDocumentUrl: string;
  bugs: BugRow[];
  coAuthorUserIds: string[];
};

function Section({
  title,
  required,
  description,
  children,
  first,
}: {
  title: string;
  required?: boolean;
  description: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div className={first ? "space-y-4" : "space-y-4 border-t pt-6"}>
      <div>
        <h3 className="font-medium">
          {title} {required && <span className="text-destructive">*</span>}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  htmlFor,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ReportForm({
  projects,
  qaUsers,
  reportId,
  initialValues,
}: {
  projects: ProjectOption[];
  qaUsers: QaUserOption[];
  reportId: string;
  initialValues: ReportFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ReportFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof ReportFormValues>(
    key: K,
    value: ReportFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateBug(index: number, key: keyof BugRow, value: string) {
    setValues((prev) => ({
      ...prev,
      bugs: prev.bugs.map((bug, i) =>
        i === index ? { ...bug, [key]: value } : bug
      ),
    }));
  }

  function addBug() {
    setValues((prev) => {
      const bugs = [...prev.bugs, { title: "", description: "", link: "" }];
      return { ...prev, bugs, productionIncidentCount: String(bugs.length) };
    });
  }

  function removeBug(index: number) {
    setValues((prev) => {
      const bugs = prev.bugs.filter((_, i) => i !== index);
      return { ...prev, bugs, productionIncidentCount: String(bugs.length) };
    });
  }

  function handleIncidentCountChange(value: string) {
    const count = Math.max(0, Math.trunc(Number(value) || 0));
    setValues((prev) => {
      const bugs = [...prev.bugs];
      while (bugs.length < count) bugs.push({ title: "", description: "", link: "" });
      while (bugs.length > count) bugs.pop();
      return { ...prev, productionIncidentCount: value, bugs };
    });
  }

  function toggleCoAuthor(userId: string) {
    setValues((prev) => ({
      ...prev,
      coAuthorUserIds: prev.coAuthorUserIds.includes(userId)
        ? prev.coAuthorUserIds.filter((id) => id !== userId)
        : [...prev.coAuthorUserIds, userId],
    }));
  }

  const beFeTotal = (Number(values.totalTcBE) || 0) + (Number(values.totalTcFE) || 0);
  const tcTotal = Number(values.totalTestCase) || 0;
  const tcExecuted = Number(values.totalTcExecuted) || 0;
  const executedPct = tcTotal > 0 ? Math.round((tcExecuted / tcTotal) * 1000) / 10 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const payload = {
      projectId: values.projectId,
      weekStart: values.weekStart,
      weekEnd: values.weekEnd,
      summary: values.summary,
      blocker: values.blocker,
      nextWeekPlan: values.nextWeekPlan,
      notes: values.notes,
      totalTestCase: Number(values.totalTestCase),
      totalTcExecuted: Number(values.totalTcExecuted),
      totalTcBE: Number(values.totalTcBE),
      totalTcBEAutomated: Number(values.totalTcBEAutomated),
      totalTcBEPassed: Number(values.totalTcBEPassed),
      totalTcBEFailed: Number(values.totalTcBEFailed),
      totalTcFE: Number(values.totalTcFE),
      totalTcFEAutomated: Number(values.totalTcFEAutomated),
      totalTcFEPassed: Number(values.totalTcFEPassed),
      totalTcFEFailed: Number(values.totalTcFEFailed),
      productionIncidentCount: Number(values.productionIncidentCount),
      bugDocumentUrl: values.bugDocumentUrl,
      bugs: values.bugs,
      coAuthorUserIds: values.coAuthorUserIds,
    };

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { message, fieldErrors } = await readApiError(
          res,
          "Gagal menyimpan report. Periksa kembali data anda."
        );
        setErrors(fieldErrors);
        toast.error("Report gagal disimpan", { description: message });
        return;
      }

      const saved = await res.json();
      toast.success("Report berhasil disimpan");
      router.push(`/reports/${saved.id}`);
      router.refresh();
    } catch {
      toast.error("Report gagal disimpan", {
        description: NETWORK_ERROR_MESSAGE,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section
            first
            title="Periode & project"
            description="Pilih project dan tentukan rentang minggu yang dilaporkan. Setiap report mencakup satu minggu penuh."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Project" required error={errors.projectId}>
                <Select
                  items={Object.fromEntries(projects.map((p) => [p.id, p.name]))}
                  value={values.projectId}
                  onValueChange={(v) => v && update("projectId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Week start" required error={errors.weekStart}>
                <Input
                  type="date"
                  value={values.weekStart}
                  onChange={(e) => update("weekStart", e.target.value)}
                  required
                />
              </Field>
              <Field label="Week end" required error={errors.weekEnd}>
                <Input
                  type="date"
                  value={values.weekEnd}
                  onChange={(e) => update("weekEnd", e.target.value)}
                  required
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Co-authors"
            description="Pilih QA lain yang perlu ikut approve report ini sebelum bisa disubmit ke QA Lead. Kamu sebagai pembuat otomatis perlu approve juga."
          >
            {qaUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada QA lain yang bisa ditambahkan sebagai co-author.
              </p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                {qaUsers.map((qa) => (
                  <label key={qa.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={values.coAuthorUserIds.includes(qa.id)}
                      onChange={() => toggleCoAuthor(qa.id)}
                    />
                    <span>
                      {qa.name}{" "}
                      <span className="text-muted-foreground">({qa.email})</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Summary"
            required
            description="Tuliskan poin-poin utama pekerjaan yang diselesaikan minggu ini. Gunakan bullet list untuk memudahkan pembacaan."
          >
            <BulletListEditor
              rows={values.summary}
              onChange={(rows) => update("summary", rows)}
              placeholder="Satu poin progress per baris"
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary}</p>
            )}
          </Section>

          <Section
            title="Production incident"
            description="Laporkan bug atau masalah yang terjadi di production minggu ini. Jika tidak ada, biarkan kosong."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jumlah production incident">
                <Input
                  type="number"
                  min={0}
                  value={values.productionIncidentCount}
                  onChange={(e) => handleIncidentCountChange(e.target.value)}
                />
              </Field>
              <Field label="Bug document URL" error={errors.bugDocumentUrl}>
                <Input
                  value={values.bugDocumentUrl}
                  onChange={(e) => update("bugDocumentUrl", e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>
            <div className="space-y-3">
              {values.bugs.map((bug, index) => (
                <div key={index} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <Field label="Judul incident">
                        <Input
                          value={bug.title}
                          onChange={(e) =>
                            updateBug(index, "title", e.target.value)
                          }
                          placeholder="Judul singkat incident"
                        />
                      </Field>
                      <Field label="Link incident">
                        <Input
                          value={bug.link}
                          onChange={(e) =>
                            updateBug(index, "link", e.target.value)
                          }
                          placeholder="https://..."
                        />
                      </Field>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 text-destructive"
                      onClick={() => removeBug(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Field label="Detail">
                    <Textarea
                      rows={1}
                      value={bug.description}
                      onChange={(e) =>
                        updateBug(index, "description", e.target.value)
                      }
                      placeholder="Detail incident"
                    />
                  </Field>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addBug}>
                <Plus className="mr-1 size-4" /> Add incident
              </Button>
            </div>
          </Section>

          <Section
            title="Test case"
            description="Nilai otomatis terisi dari report sebelumnya untuk project ini. Tidak perlu diisi ulang dari awal — cukup sesuaikan atau tambahkan jika ada test case baru minggu ini. Total BE + FE harus sama atau lebih besar dari jumlah total."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Test case total" required error={errors.totalTestCase}>
                <Input
                  type="number"
                  min={0}
                  value={values.totalTestCase}
                  onChange={(e) => update("totalTestCase", e.target.value)}
                />
              </Field>
              <Field label="Test case BE total" required>
                <Input
                  type="number"
                  min={0}
                  value={values.totalTcBE}
                  onChange={(e) => update("totalTcBE", e.target.value)}
                />
              </Field>
              <Field label="Test case FE total" required>
                <Input
                  type="number"
                  min={0}
                  value={values.totalTcFE}
                  onChange={(e) => update("totalTcFE", e.target.value)}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              BE + FE = {beFeTotal}
            </p>
            <Field
              label="TC Executed (kumulatif project)"
              required
              error={errors.totalTcExecuted}
            >
              <Input
                type="number"
                min={0}
                value={values.totalTcExecuted}
                onChange={(e) => update("totalTcExecuted", e.target.value)}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Total TC yang sudah dieksekusi sejak awal project (bukan cuma minggu
              ini) &mdash; dipakai untuk menghitung persentase progress project di
              dashboard admin. Progress saat ini: {tcExecuted}/{tcTotal} (
              {executedPct}%)
            </p>
          </Section>

          <Section
            title="Automation"
            description="Nilai otomatis terisi dari report sebelumnya. Sesuaikan atau tambahkan jika ada automation baru yang di-run minggu ini (total yang di-automate, passed, dan failed) untuk backend dan frontend. Total automation tidak boleh melebihi jumlah test case manual."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3 rounded-md border p-3">
                <h4 className="text-sm font-medium">Backend</h4>
                <Field label="BE total" error={errors.totalTcBEAutomated}>
                  <Input
                    type="number"
                    min={0}
                    value={values.totalTcBEAutomated}
                    onChange={(e) => update("totalTcBEAutomated", e.target.value)}
                  />
                </Field>
                <Field label="BE passed" error={errors.totalTcBEPassed}>
                  <Input
                    type="number"
                    min={0}
                    value={values.totalTcBEPassed}
                    onChange={(e) => update("totalTcBEPassed", e.target.value)}
                  />
                </Field>
                <Field label="BE failed">
                  <Input
                    type="number"
                    min={0}
                    value={values.totalTcBEFailed}
                    onChange={(e) => update("totalTcBEFailed", e.target.value)}
                  />
                </Field>
              </div>
              <div className="space-y-3 rounded-md border p-3">
                <h4 className="text-sm font-medium">Frontend</h4>
                <Field label="FE total" error={errors.totalTcFEAutomated}>
                  <Input
                    type="number"
                    min={0}
                    value={values.totalTcFEAutomated}
                    onChange={(e) => update("totalTcFEAutomated", e.target.value)}
                  />
                </Field>
                <Field label="FE passed" error={errors.totalTcFEPassed}>
                  <Input
                    type="number"
                    min={0}
                    value={values.totalTcFEPassed}
                    onChange={(e) => update("totalTcFEPassed", e.target.value)}
                  />
                </Field>
                <Field label="FE failed">
                  <Input
                    type="number"
                    min={0}
                    value={values.totalTcFEFailed}
                    onChange={(e) => update("totalTcFEFailed", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            title="Blocker & plan"
            description="Tuliskan kendala yang menghambat progress minggu ini, rencana pekerjaan minggu depan, dan catatan tambahan jika ada."
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Blocker</Label>
                <BulletListEditor
                  rows={values.blocker}
                  onChange={(rows) => update("blocker", rows)}
                  placeholder="Satu blocker per baris"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Next week plan <span className="text-destructive">*</span>
                </Label>
                <BulletListEditor
                  rows={values.nextWeekPlan}
                  onChange={(rows) => update("nextWeekPlan", rows)}
                  placeholder="Satu rencana per baris"
                />
                {errors.nextWeekPlan && (
                  <p className="text-sm text-destructive">
                    {errors.nextWeekPlan}
                  </p>
                )}
              </div>
              <Field label="Notes">
                <Textarea
                  rows={3}
                  value={values.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                />
              </Field>
            </div>
          </Section>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
