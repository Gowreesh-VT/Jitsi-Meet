"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { DOMAINS, EVENT_TYPES, type SerializedEvent } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EventFormState = {
  title: string;
  description: string;
  domain: string;
  type: string;
  startTime: string;
  endTime: string;
  roomName: string;
  statusOverride: "auto" | "live" | "ended";
  isPublished: boolean;
};

function getInitialForm(event?: SerializedEvent | null): EventFormState {
  if (event) {
    return {
      title: event.title,
      description: event.description,
      domain: event.domain,
      type: event.type,
      startTime: toLocalDatetime(event.startTime),
      endTime: toLocalDatetime(event.endTime),
      roomName: event.roomName,
      statusOverride: event.statusOverride,
      isPublished: event.isPublished,
    };
  }

  return {
    title: "",
    description: "",
    domain: "AI/ML",
    type: "session",
    startTime: "",
    endTime: "",
    roomName: "",
    statusOverride: "auto",
    isPublished: false,
  };
}

const emptyForm: EventFormState = {
  title: "",
  description: "",
  domain: "AI/ML",
  type: "session",
  startTime: "",
  endTime: "",
  roomName: "",
  statusOverride: "auto",
  isPublished: false,
};

function toLocalDatetime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminEventForm({
  event,
  onSubmit,
  onCancel,
}: {
  event?: SerializedEvent | null;
  onSubmit: (payload: EventFormState) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = React.useState<EventFormState>(() => getInitialForm(event));
  const [saving, setSaving] = React.useState(false);

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
      if (!event) setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          required
          rows={4}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="domain">Domain</Label>
          <select
            id="domain"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
          >
            {DOMAINS.map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" required type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" required type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="roomName">Jitsi room name</Label>
        <Input id="roomName" required value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="statusOverride">Manual status</Label>
        <select
          id="statusOverride"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={form.statusOverride}
          onChange={(e) => setForm({ ...form, statusOverride: e.target.value as EventFormState["statusOverride"] })}
        >
          <option value="auto">Auto from schedule</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
        </select>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        Publish event
      </label>
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving" : event ? "Update Event" : "Create Event"}
        </Button>
        {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </form>
  );
}
