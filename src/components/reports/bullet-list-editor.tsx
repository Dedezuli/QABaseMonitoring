"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus } from "lucide-react";

export function BulletListEditor({
  rows,
  onChange,
  placeholder,
  addLabel = "Add row",
}: {
  rows: string[];
  onChange: (rows: string[]) => void;
  placeholder: string;
  addLabel?: string;
}) {
  const display = rows.length > 0 ? rows : [""];

  function updateRow(index: number, value: string) {
    const next = [...display];
    next[index] = value;
    onChange(next);
  }

  function removeRow(index: number) {
    const next = display.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [""]);
  }

  function addRow() {
    onChange([...display, ""]);
  }

  return (
    <div className="space-y-2">
      {display.map((row, index) => (
        <div key={index} className="flex items-start gap-2">
          <Textarea
            rows={1}
            value={row}
            onChange={(e) => updateRow(index, e.target.value)}
            placeholder={placeholder}
            className="min-h-9 resize-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mt-0.5 shrink-0"
            onClick={() => removeRow(index)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1 size-4" /> {addLabel}
      </Button>
    </div>
  );
}
