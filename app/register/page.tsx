"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useAuth } from "@/contexts/auth-context";
import { title } from "@/components/primitives";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        email,
        password,
        password_confirm: confirmPassword,
        full_name: fullName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className={title()}>Get Started</h1>
          <p className="text-default-500 mt-2">
            Create your account to find study buddies
          </p>
        </div>

        <Card>
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-danger-50 text-danger border border-danger-200">
                  {error}
                </div>
              )}

              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                variant="bordered"
                autoComplete="name"
              />

              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="bordered"
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                variant="bordered"
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                variant="bordered"
                autoComplete="new-password"
              />

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={loading}
              >
                Create Account
              </Button>

              <div className="text-center text-sm">
                <span className="text-default-500">
                  Already have an account?{" "}
                </span>
                <Link href="/login" size="sm">
                  Sign in
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

