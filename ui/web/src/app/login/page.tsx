"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, AlertCircle, Info } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// The demonstration accounts, one per department.
//
// This page offered a single account — Kolkata Police's administrator — so a
// visitor had no way of knowing the other three departments existed, let alone
// how to sign into them. The platform connects four; the door should show all
// four.
//
// Every one of these officers is fictional and they share one password. They
// exist on the demonstration deployment only and must be removed, or their
// passwords rotated, before the platform holds a real record.
const DEMO_PASSWORD = "Demo@123";

interface DemoAccount {
  username: string;
  force: string;
  forceBn: string;
  rank: string;
  posting: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: "sho", force: "Kolkata Police", forceBn: "কলকাতা পুলিশ",
    rank: "Officer in charge", posting: "Bhowanipore Police Station" },
  { username: "admin", force: "Kolkata Police", forceBn: "কলকাতা পুলিশ",
    rank: "Director General", posting: "Lalbazar — sees every module" },
  { username: "oc.brs", force: "West Bengal Police", forceBn: "পশ্চিমবঙ্গ পুলিশ",
    rank: "Officer in charge", posting: "Barasat Police Station" },
  { username: "sp.cid", force: "CID", forceBn: "সিআইডি",
    rank: "Superintendent", posting: "Homicide Squad, Bhabani Bhavan" },
  { username: "oc.tg.pks", force: "Kolkata Traffic Police", forceBn: "কলকাতা ট্রাফিক পুলিশ",
    rank: "Officer in charge", posting: "Park Street Traffic Guard" },
];

// Login validation schema
const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Enter your username")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Explain why the officer is back at sign-in when a session ended.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reason") === "expired") {
      setError("Your session has ended. Sign in again to continue.");
    }
  }, []);

  // Put one of the demonstration officers into the form, so that trying a
  // department takes one click rather than knowing a username.
  const useAccount = (account: DemoAccount) => {
    setValue("username", account.username);
    setValue("password", DEMO_PASSWORD);
    setError("");
  };

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setIsLoading(true);

    try {
      const success = await login(data.username, data.password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Please check your username and password.");
      }
    } catch {
      // No offline or demo sign-in: without the API there is no session token,
      // so every screen would fail after a pretend login.
      setError("The server could not be reached. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-accent/10">
              <Shield className="h-12 w-12 text-accent" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">NPDMS</h1>
          <p className="text-foreground-muted mt-1">
            National Police Department Management System
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-3 rounded-md bg-error/10 border border-error/30">
                  <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Username / Badge Number
                </label>
                <input
                  {...register("username")}
                  type="text"
                  placeholder="Enter username"
                  autoComplete="username"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
                {errors.username && (
                  <p className="text-xs text-error">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
                {errors.password && (
                  <p className="text-xs text-error">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* The demonstration accounts, one per department */}
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-accent" />
            <span className="text-sm font-medium text-foreground">
              Demonstration accounts · প্রদর্শনী অ্যাকাউন্ট
            </span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-foreground-muted">
            The platform connects four departments. Choose one to sign in as that
            officer — each sees their own department&apos;s records and their own
            modules. Every account below is fictional.
          </p>

          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => useAccount(account)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:border-accent hover:bg-surface-hover"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {account.force}
                  </span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {account.rank} · {account.posting}
                  </span>
                </span>
                <code className="shrink-0 rounded bg-surface-sunken px-2 py-0.5 font-mono text-xs text-foreground-muted">
                  {account.username}
                </code>
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-foreground-subtle">
            All use the password <code className="font-mono">{DEMO_PASSWORD}</code>.
            Remove these accounts before the platform holds a real record.
          </p>
        </div>

        {/* Whose platform this is. Policing is a state subject: this belongs to
            West Bengal's forces, not to the central ministry the page used to
            name. */}
        <p className="mt-6 text-center text-xs text-foreground-muted">
          Kolkata Police · West Bengal Police
          <br />
          Authorised personnel only · শুধুমাত্র অনুমোদিত কর্মীদের জন্য
        </p>
      </div>
    </div>
  );
}
