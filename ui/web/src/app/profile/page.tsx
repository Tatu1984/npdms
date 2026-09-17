"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, KeyRound, Loader2, User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, Field, PageHeader, Panel } from "@/components/platform/primitives";
import { ActivityTrail } from "@/components/platform/ActivityTrail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toastStore";
import { getRoleDisplayName } from "@/stores/authStore";
import type { Role } from "@/types";
import { useI18n } from "@/lib/i18n";
import authApi, { type User as ApiUser } from "@/lib/api/auth";
import { formatDateTime } from "@/lib/utils";

const L = {
  title: { en: "My profile", bn: "আমার প্রোফাইল" },
  description: { en: "Your account as recorded by the platform.", bn: "প্ল্যাটফর্মে নথিভুক্ত আপনার অ্যাকাউন্ট।" },
  account: { en: "Account", bn: "অ্যাকাউন্ট" },
  name: { en: "Name", bn: "নাম" },
  username: { en: "Username", bn: "ব্যবহারকারীর নাম" },
  rank: { en: "Rank", bn: "পদ" },
  badge: { en: "Badge number", bn: "ব্যাজ নম্বর" },
  station: { en: "Station", bn: "থানা" },
  email: { en: "Email", bn: "ইমেল" },
  phone: { en: "Phone", bn: "ফোন" },
  lastLogin: { en: "Previous sign-in", bn: "আগের সাইন-ইন" },
  loading: { en: "Loading your profile…", bn: "প্রোফাইল লোড হচ্ছে…" },
  loadFailed: { en: "Your profile could not be loaded", bn: "প্রোফাইল লোড করা যায়নি" },
  retry: { en: "Try again", bn: "আবার চেষ্টা করুন" },
  password: { en: "Change password", bn: "পাসওয়ার্ড পরিবর্তন" },
  passwordHint: {
    en: "At least 8 characters. Your sign-ins and failed attempts are recorded in the access log.",
    bn: "অন্তত ৮টি অক্ষর। আপনার সাইন-ইন ও ব্যর্থ প্রচেষ্টা অ্যাক্সেস লগে নথিভুক্ত হয়।",
  },
  current: { en: "Current password", bn: "বর্তমান পাসওয়ার্ড" },
  next: { en: "New password", bn: "নতুন পাসওয়ার্ড" },
  confirm: { en: "Repeat new password", bn: "নতুন পাসওয়ার্ড আবার লিখুন" },
  save: { en: "Change password", bn: "পাসওয়ার্ড পরিবর্তন করুন" },
  mismatch: { en: "The new passwords do not match", bn: "নতুন পাসওয়ার্ড দুটি মেলেনি" },
  tooShort: { en: "The new password must be at least 8 characters", bn: "নতুন পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে" },
  changed: { en: "Password changed", bn: "পাসওয়ার্ড পরিবর্তিত হয়েছে" },
  failed: { en: "Password not changed", bn: "পাসওয়ার্ড পরিবর্তন হয়নি" },
};

export default function ProfilePage() {
  const { pick } = useI18n();
  const me = useQuery({ queryKey: ["me"], queryFn: authApi.getCurrentUser });
  const change = useMutation({
    mutationFn: (v: { oldPassword: string; newPassword: string }) => authApi.changePassword(v.oldPassword, v.newPassword),
  });
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async () => {
    if (next.length < 8) {
      toast.error(pick(L.failed), pick(L.tooShort));
      return;
    }
    if (next !== confirm) {
      toast.error(pick(L.failed), pick(L.mismatch));
      return;
    }
    try {
      await change.mutateAsync({ oldPassword: current, newPassword: next });
      toast.success(pick(L.changed), "");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(pick(L.failed), err instanceof Error ? err.message : "");
    }
  };

  const u: ApiUser | undefined = me.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={pick(L.title)} description={pick(L.description)} icon={User} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title={pick(L.account)}>
            {me.isPending ? (
              <div className="flex items-center gap-3 py-6 text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> {pick(L.loading)}
              </div>
            ) : me.isError || !u ? (
              <EmptyState
                icon={AlertTriangle}
                title={pick(L.loadFailed)}
                description={me.error?.message}
                action={
                  <Button variant="secondary" onClick={() => me.refetch()}>
                    {pick(L.retry)}
                  </Button>
                }
              />
            ) : (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={pick(L.name)} value={u.name} />
                <Field label={pick(L.username)} value={u.username} mono />
                <Field label={pick(L.rank)} value={getRoleDisplayName(u.role as Role)} />
                <Field label={pick(L.badge)} value={u.badgeNumber} mono />
                <Field label={pick(L.station)} value={u.stationName} />
                <Field label={pick(L.email)} value={u.email} />
                <Field label={pick(L.phone)} value={u.phone} />
                <Field
                  label={pick(L.lastLogin)}
                  value={(u as ApiUser & { lastLogin?: string | null }).lastLogin ? formatDateTime((u as ApiUser & { lastLogin?: string }).lastLogin!) : null}
                />
              </dl>
            )}
          </Panel>

          <Panel title={pick(L.password)} description={pick(L.passwordHint)}>
            <div className="space-y-4">
              <Input type="password" label={pick(L.current)} value={current} onChange={(v: string) => setCurrent(v)} autoComplete="current-password" />
              <Input type="password" label={pick(L.next)} value={next} onChange={(v: string) => setNext(v)} autoComplete="new-password" />
              <Input type="password" label={pick(L.confirm)} value={confirm} onChange={(v: string) => setConfirm(v)} autoComplete="new-password" />
              <div className="flex justify-end">
                <Button onClick={submit} disabled={change.isPending || !current || !next}>
                  {change.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {pick(L.save)}
                </Button>
              </div>
            </div>
          </Panel>

          {/* An officer can read their own trail. The platform records where
              officers go in it, and somebody who is recorded should be able to
              see the record and how long it is kept — which the panel states. */}
          <Panel
            title="Where you have been"
            description="The screens you opened in this platform, and for how long."
          >
            <ActivityTrail days={7} />
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
