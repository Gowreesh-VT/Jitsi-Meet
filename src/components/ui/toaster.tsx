"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border bg-card p-4 text-card-foreground shadow-lg",
            toast.variant === "destructive" && "border-destructive",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p> : null}
            </div>
            <Button aria-label="Dismiss toast" variant="ghost" size="icon" className="h-7 w-7" onClick={() => dismiss(toast.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
