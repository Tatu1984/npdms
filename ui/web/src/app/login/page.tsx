"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Use demo accounts: constable, sho, sp, or dgp with password: demo123");
      }
    } catch (err) {
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-3 rounded-md bg-error/10 border border-error/30">
                  <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <Input
                label="Username / Badge Number"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={setUsername}
                required
                autoComplete="username"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={setPassword}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Demo Accounts Info */}
            <div className="mt-6 p-4 rounded-md bg-background-tertiary">
              <p className="text-xs font-medium text-foreground-muted mb-3">
                Demo Accounts (Password: demo123)
              </p>

              {/* Station Level */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">Station Level</p>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#4A9EFF]" />
                    <span className="text-foreground-muted">constable</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#4A9EFF]" />
                    <span className="text-foreground-muted">hc</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#4A9EFF]" />
                    <span className="text-foreground-muted">asi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#36B37E]" />
                    <span className="text-foreground-muted">si</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#36B37E]" />
                    <span className="text-foreground-muted">inspector</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#36B37E]" />
                    <span className="text-foreground-muted">sho</span>
                  </div>
                </div>
              </div>

              {/* District Level */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">District Level</p>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#FFAB00]" />
                    <span className="text-foreground-muted">dsp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#FFAB00]" />
                    <span className="text-foreground-muted">sp</span>
                  </div>
                </div>
              </div>

              {/* State Level */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">State Level</p>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#9B59B6]" />
                    <span className="text-foreground-muted">dig</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#9B59B6]" />
                    <span className="text-foreground-muted">ig</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#9B59B6]" />
                    <span className="text-foreground-muted">dgp</span>
                  </div>
                </div>
              </div>

              {/* Central Level */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">Central Level</p>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#E74C3C]" />
                    <span className="text-foreground-muted">secretary</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
