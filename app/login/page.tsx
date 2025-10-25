"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useAuth } from "@/contexts/auth-context";
import { title } from "@/components/primitives";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className={title()}>Welcome Back</h1>
          <p className="text-default-500 mt-2">Sign in to your account</p>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                variant="bordered"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={loading}
              >
                Sign In
              </Button>

              <div className="text-center text-sm">
                <span className="text-default-500">Don't have an account? </span>
                <Link href="/register" size="sm">
                  Sign up
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}


