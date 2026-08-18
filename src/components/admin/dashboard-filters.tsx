"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function DashboardFilters({
  projects,
  qaUsers,
}: {
  projects: { id: string; name: string }[];
  qaUsers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projectId, setProjectId] = useState(
    searchParams.get("projectId") ?? ALL
  );
  const [userId, setUserId] = useState(searchParams.get("userId") ?? ALL);
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (projectId !== ALL) params.set("projectId", projectId);
    if (userId !== ALL) params.set("userId", userId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/admin/dashboard?${params.toString()}`);
  }

  function resetFilters() {
    setProjectId(ALL);
    setUserId(ALL);
    setFrom("");
    setTo("");
    router.push("/admin/dashboard");
  }

  return (
    <form
      onSubmit={applyFilters}
      className="flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div className="space-y-1">
        <Label>Project</Label>
        <Select
          items={{
            [ALL]: "Semua Project",
            ...Object.fromEntries(projects.map((p) => [p.id, p.name])),
          }}
          value={projectId}
          onValueChange={(v) => v && setProjectId(v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Project</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>QA</Label>
        <Select
          items={{
            [ALL]: "Semua QA",
            ...Object.fromEntries(qaUsers.map((u) => [u.id, u.name])),
          }}
          value={userId}
          onValueChange={(v) => v && setUserId(v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua QA</SelectItem>
            {qaUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Dari tanggal</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label>Sampai tanggal</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Terapkan</Button>
        <Button type="button" variant="outline" onClick={resetFilters}>
          Reset
        </Button>
      </div>
    </form>
  );
}
