"use client";

import { DOMAINS, type Domain } from "@/lib/events";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DomainFilterValue = "All" | Domain;

const labels: DomainFilterValue[] = ["All", ...DOMAINS];

export function DomainFilter({
  value,
  onChange,
}: {
  value: DomainFilterValue;
  onChange: (value: DomainFilterValue) => void;
}) {
  return (
    <Tabs>
      <TabsList className="justify-start gap-1">
        {labels.map((label) => (
          <TabsTrigger key={label} active={value === label} onClick={() => onChange(label)}>
            {label === "AI/ML" ? "AI-ML" : label === "UI/UX" ? "UI-UX" : label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
