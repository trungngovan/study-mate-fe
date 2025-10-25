"use client";

import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { button as buttonStyles } from "@heroui/theme";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

import { title, subtitle } from "@/components/primitives";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 h-full">
        <div>Loading...</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10">
      {/* Hero Section */}
      <div className="inline-block max-w-2xl text-center justify-center">
        <h1 className={title()}>
          Find Your&nbsp;
          <span className={title({ color: "violet" })}>Study Buddy&nbsp;</span>
          <br />
          Near You
        </h1>
        <div className={subtitle({ class: "mt-4" })}>
          Connect with learners nearby, share knowledge, and achieve your goals
          together.
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-3">
        <Link
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
            size: "lg",
          })}
          href="/register"
        >
          Get Started
        </Link>
        <Link
          className={buttonStyles({
            variant: "bordered",
            radius: "full",
            size: "lg",
          })}
          href="/login"
        >
          Sign In
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl">
        <Card>
          <CardBody className="text-center p-6">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-bold mb-2">Find Nearby</h3>
            <p className="text-default-500">
              Discover learners around you who share your interests and goals
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-2">Connect</h3>
            <p className="text-default-500">
              Send connection requests and build your study network
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Learn Together</h3>
            <p className="text-default-500">
              Share subjects, set goals, and achieve more through collaboration
            </p>
          </CardBody>
        </Card>
      </div>

      {/* How it works */}
      <div className="max-w-3xl mt-12">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-1">
                Create Your Profile
              </h4>
              <p className="text-default-500">
                Sign up and tell us about your school, subjects, and learning
                goals
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-1">
                Discover Study Buddies
              </h4>
              <p className="text-default-500">
                Browse learners nearby and find people who match your interests
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-1">
                Start Learning Together
              </h4>
              <p className="text-default-500">
                Send connection requests and begin your collaborative learning
                journey
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mt-12 text-center">
        <Button
          as={Link}
          color="primary"
          size="lg"
          variant="shadow"
          radius="full"
          href="/register"
        >
          Join StudyMate Today
        </Button>
      </div>
    </section>
  );
}
