"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Loader2, User } from "lucide-react";

const fieldClassName =
  "h-11 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white outline-none transition-colors focus:border-[#ffafd5] focus:ring-2 focus:ring-[#ffafd5]/20";

const formSchema = z
  .object({
    mobileNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian mobile number."),
    registrationNumber: z.string().min(1, "Registration number is required."),
    institutionType: z.enum(["College", "School"]),
    schoolCollegeName: z.string().min(1, "Institution name is required."),
    grade: z.string().optional(),
    year: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.institutionType === "School" && !values.grade) {
      ctx.addIssue({ code: "custom", path: ["grade"], message: "Grade is required." });
    }
    if (values.institutionType === "College" && !values.year) {
      ctx.addIssue({ code: "custom", path: ["year"], message: "College year is required." });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export type SavedProfile = {
  mobileNumber: string;
  registrationNumber: string;
  schoolCollegeName: string;
  institutionType: "College" | "School";
  grade: string;
  year: string;
};

// ─── Quick Confirm Dialog ───────────────────────────────────────────────────

function QuickConfirmDialog({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  profile,
  onSuccess,
  onUseFullForm,
}: {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  profile: SavedProfile;
  onSuccess: () => void;
  onUseFullForm: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleConfirm() {
    setLoading(true);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...profile }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to register");

      toast({
        title: "Registered!",
        description: `You're registered for ${eventTitle}.`,
      });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to register";
      toast({ title: "Registration Failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const label =
    profile.institutionType === "College"
      ? profile.year
      : profile.grade;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[480px] border border-[#ffafd5]/25 bg-black/95 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-normal text-[#ffafd5] sm:text-3xl">
            CONFIRM REGISTRATION
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-arcade-muted sm:text-base">
            Register for{" "}
            <span className="font-bold text-white">{eventTitle}</span> using
            your saved details.
          </DialogDescription>
        </DialogHeader>

        {/* Saved profile summary */}
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-[#ffafd5]" />
            <span className="text-xs font-black tracking-widest text-[#ffafd5] uppercase">
              Your Details
            </span>
          </div>
          <ProfileRow label="Mobile" value={profile.mobileNumber} />
          <ProfileRow label="Reg. No." value={profile.registrationNumber} />
          <ProfileRow label="Institution" value={profile.schoolCollegeName} />
          {label && (
            <ProfileRow
              label={profile.institutionType === "College" ? "Year" : "Grade"}
              value={label}
            />
          )}
        </div>

        <p className="text-xs text-arcade-muted">
          Not your details?{" "}
          <button
            type="button"
            onClick={onUseFullForm}
            className="text-[#ffafd5] underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Update and register
          </button>
        </p>

        <DialogFooter className="gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/15 text-arcade-muted hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 arcade-btn h-12 font-black tracking-widest"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                YES, REGISTER
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-arcade-muted font-bold uppercase tracking-wider text-xs">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

// ─── Full Form Dialog ───────────────────────────────────────────────────────

export function RegisterDialog({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  isVitStudent,
  onSuccess,
  savedProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  isVitStudent: boolean;
  onSuccess: () => void;
  savedProfile?: SavedProfile | null;
}) {
  const [loading, setLoading] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const { toast } = useToast();

  // If user has a saved profile and we haven't forced the full form, show quick confirm
  const useQuickConfirm = !!savedProfile && !showFullForm;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobileNumber: savedProfile?.mobileNumber ?? "",
      registrationNumber: savedProfile?.registrationNumber ?? "",
      institutionType: savedProfile?.institutionType ?? "College",
      schoolCollegeName:
        savedProfile?.schoolCollegeName ??
        (isVitStudent ? "Vellore Institute Of Technology" : ""),
      grade: savedProfile?.grade ?? "",
      year: savedProfile?.year ?? "",
    },
  });

  const institutionType = useWatch({
    control: form.control,
    name: "institutionType",
    defaultValue: savedProfile?.institutionType ?? "College",
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...values }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to register");

      toast({
        title: "Registration Successful",
        description: `You are now registered for ${eventTitle}`,
      });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to register";
      toast({ title: "Registration Failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Quick confirm path
  if (useQuickConfirm) {
    return (
      <QuickConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        eventId={eventId}
        eventTitle={eventTitle}
        profile={savedProfile}
        onSuccess={onSuccess}
        onUseFullForm={() => setShowFullForm(true)}
      />
    );
  }

  // Full form path
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setShowFullForm(false); onClose(); } }}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[560px] border border-[#ffafd5]/25 bg-black/95 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-normal text-[#ffafd5] sm:text-3xl">
            EVENT REGISTRATION
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-arcade-muted sm:text-base">
            Enter your details to register for{" "}
            <span className="text-white font-bold">{eventTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 pt-4"
          >
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} className={fieldClassName} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isVitStudent ? "VIT Registration Number" : "Registration Number"}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="22BCE1234" {...field} className={fieldClassName} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="institutionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School / College</FormLabel>
                  <FormControl>
                    <select {...field} className={fieldClassName}>
                      <option value="College">College</option>
                      <option value="School">School</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {institutionType === "College" && (
              <>
                <FormField
                  control={form.control}
                  name="schoolCollegeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            isVitStudent ? "Vellore Institute Of Technology" : "College Name"
                          }
                          {...field}
                          className={fieldClassName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <select {...field} className={fieldClassName}>
                          <option value="">Select year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Other">Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {institutionType === "School" && (
              <>
                <FormField
                  control={form.control}
                  name="schoolCollegeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="School Name" {...field} className={fieldClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <FormControl>
                        <select {...field} className={fieldClassName}>
                          <option value="">Select grade</option>
                          <option value="10th">10th</option>
                          <option value="11th">11th</option>
                          <option value="12th">12th</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="sticky bottom-0 bg-black/95 pt-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full arcade-btn h-12 text-sm font-black tracking-widest sm:text-base"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "CONFIRM REGISTRATION"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
