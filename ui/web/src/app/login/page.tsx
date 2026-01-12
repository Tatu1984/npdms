"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, AlertCircle, Info } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Demo credentials for demonstration purposes
const DEMO_CREDENTIALS = {
  username: "admin",
  password: "Demo@123",
  role: "DGP (Full Access)"
};

// Login validation schema
const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
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
  const { login, setUser } = useAuthStore();
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

  // Fill demo credentials
  const fillDemoCredentials = () => {
    setValue("username", DEMO_CREDENTIALS.username);
    setValue("password", DEMO_CREDENTIALS.password);
  };

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setIsLoading(true);

    try {
      const success = await login(data.username, data.password);
      if (success) {
        router.push("/dashboard");
      } else {
        // Try demo mode fallback if API login fails
        if (data.username === DEMO_CREDENTIALS.username && data.password === DEMO_CREDENTIALS.password) {
          // Set demo user directly for demonstration
          setUser({
            id: "demo-admin-001",
            name: "System Administrator",
            badgeNumber: "ADMIN-001",
            role: "DGP",
            stationId: "550e8400-e29b-41d4-a716-446655440001",
            stationName: "Koramangala Police Station",
            districtId: "dist-001",
            districtName: "Bangalore Urban",
            stateId: "state-kar",
            stateName: "Karnataka",
          });
          router.push("/dashboard");
          return;
        }
        setError("Invalid credentials. Please check your username and password.");
      }
    } catch {
      // Try demo mode fallback on error
      if (data.username === DEMO_CREDENTIALS.username && data.password === DEMO_CREDENTIALS.password) {
        setUser({
          id: "demo-admin-001",
          name: "System Administrator",
          badgeNumber: "ADMIN-001",
          role: "DGP",
          stationId: "550e8400-e29b-41d4-a716-446655440001",
          stationName: "Koramangala Police Station",
          districtId: "dist-001",
          districtName: "Bangalore Urban",
          stateId: "state-kar",
          stateName: "Karnataka",
        });
        router.push("/dashboard");
        return;
      }
      setError("An error occurred. Please try again.");
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

        {/* Demo Credentials Box */}
        <div className="mt-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Demo Credentials</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-foreground-muted">Username:</span>
              <code className="px-2 py-0.5 bg-background rounded text-foreground font-mono">
                {DEMO_CREDENTIALS.username}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-muted">Password:</span>
              <code className="px-2 py-0.5 bg-background rounded text-foreground font-mono">
                {DEMO_CREDENTIALS.password}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-muted">Role:</span>
              <span className="text-accent font-medium">{DEMO_CREDENTIALS.role}</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={fillDemoCredentials}
          >
            Use Demo Credentials
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-foreground-muted mt-6">
          Government of India - Ministry of Home Affairs
          <br />
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
