"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { apiClient } from "@/lib/api-client";
import { useLocation } from "@/lib/use-location";
import type { ConnectionStats, UserSubject, UserGoal } from "@/types/api";
import { title } from "@/components/primitives";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { location, updateLocation, loading: locationLoading } = useLocation();
  const [locationChecked, setLocationChecked] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadDashboardData();
      checkLocation();
    }
  }, [user, authLoading, router]);

  const checkLocation = async () => {
    // Check if we have a cached location (uses cached if < 15 min old)
    await updateLocation(false);
    setLocationChecked(true);
  };

  const loadDashboardData = async () => {
    try {
      const [statsData, subjectsData, goalsData] = await Promise.all([
        apiClient.getConnectionStats(),
        apiClient.getUserSubjects().catch(() => []),
        apiClient.getUserGoals().catch(() => []),
      ]);
      setStats(statsData);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setSubjects([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationAccess = async () => {
    await updateLocation(true); // Force refresh to get new location
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="py-8 md:py-10 space-y-8">
      <div>
        <h1 className={title()}>
          Welcome back, <span className="text-primary">{user.full_name}</span>!
        </h1>
        <p className="text-default-500 mt-2">
          Here's what's happening with your study network
        </p>
      </div>

      {/* Location Status Card */}
      {locationChecked && !location && (
        <Card className="border-warning">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📍</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  Enable Location Access
                </h3>
                <p className="text-default-500 mb-4">
                  To discover study buddies near you, we need access to your
                  location. Your location is only used to find nearby learners
                  and is never shared without your permission.
                </p>
                <Button 
                  color="warning" 
                  onClick={requestLocationAccess}
                  isLoading={locationLoading}
                >
                  Enable Location
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Location Active Indicator */}
      {location && location.last_updated && (
        <Card className="bg-success-50 border-success-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-success-800">Location Active</h4>
                  <p className="text-sm text-success-700">
                    Last updated: {new Date(location.last_updated).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                color="success"
                variant="flat"
                onClick={requestLocationAccess}
                isLoading={locationLoading}
              >
                Update Now
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {stats.accepted_connections}
              </div>
              <div className="text-default-500">Connections</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6 text-center">
              <div className="text-3xl font-bold text-success mb-2">
                {stats.received_pending}
              </div>
              <div className="text-default-500">Pending Requests</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6 text-center">
              <div className="text-3xl font-bold text-warning mb-2">
                {stats.sent_pending}
              </div>
              <div className="text-default-500">Sent Requests</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {subjects.length}
              </div>
              <div className="text-default-500">Subjects</div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      {/* <Card>
        <CardHeader className="pb-0 pt-6 px-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              as={Link}
              href="/discover"
              color="primary"
              size="lg"
              className="h-24 flex-col"
            >
              <div className="text-2xl mb-2">🔍</div>
              <div>Discover Nearby</div>
            </Button>

            <Button
              as={Link}
              href="/connections"
              color="secondary"
              size="lg"
              className="h-24 flex-col"
            >
              <div className="text-2xl mb-2">🤝</div>
              <div>My Connections</div>
            </Button>

            <Button
              as={Link}
              href="/profile"
              color="default"
              variant="bordered"
              size="lg"
              className="h-24 flex-col"
            >
              <div className="text-2xl mb-2">👤</div>
              <div>Edit Profile</div>
            </Button>
          </div>
        </CardBody>
      </Card> */}

      {/* Subjects & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subjects */}
        <Card>
          <CardHeader className="pb-0 pt-6 px-6 flex justify-between items-center">
            <h2 className="text-xl font-bold">My Subjects</h2>
            <Button
              as={Link}
              href="/profile#subjects"
              size="sm"
              variant="flat"
              color="primary"
            >
              Manage
            </Button>
          </CardHeader>
          <CardBody className="p-6">
            {subjects.length === 0 ? (
              <div className="text-center text-default-400 py-8">
                <p>No subjects added yet</p>
                <Button
                  as={Link}
                  href="/profile#subjects"
                  color="primary"
                  variant="flat"
                  size="sm"
                  className="mt-4"
                >
                  Add Subjects
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.slice(0, 5).map((userSubject) => (
                  <div
                    key={userSubject.id}
                    className="flex items-center justify-between p-3 bg-default-100 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">
                        {userSubject.subject_name_en || userSubject.subject_code || `Subject #${userSubject.subject}`}
                      </div>
                      <div className="text-sm text-default-500">
                        {userSubject.level} • {userSubject.intent}
                      </div>
                    </div>
                    <Chip size="sm" variant="flat" color="primary">
                      {userSubject.level}
                    </Chip>
                  </div>
                ))}
                {subjects.length > 5 && (
                  <div className="text-center text-sm text-default-400">
                    +{subjects.length - 5} more
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader className="pb-0 pt-6 px-6 flex justify-between items-center">
            <h2 className="text-xl font-bold">My Goals</h2>
            <Button
              as={Link}
              href="/profile#goals"
              size="sm"
              variant="flat"
              color="primary"
            >
              Manage
            </Button>
          </CardHeader>
          <CardBody className="p-6">
            {goals.length === 0 ? (
              <div className="text-center text-default-400 py-8">
                <p>No goals added yet</p>
                <Button
                  as={Link}
                  href="/profile#goals"
                  color="primary"
                  variant="flat"
                  size="sm"
                  className="mt-4"
                >
                  Add Goals
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 5).map((userGoal) => (
                  <div
                    key={userGoal.id}
                    className="flex items-center justify-between p-3 bg-default-100 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        {userGoal.goal_name || `Goal #${userGoal.goal}`}
                      </div>
                      {userGoal.target_value && (
                        <div className="text-sm text-default-500">
                          Target: {userGoal.target_value}
                        </div>
                      )}
                      {userGoal.target_date && (
                        <div className="text-sm text-default-500">
                          Date: {new Date(userGoal.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {goals.length > 5 && (
                  <div className="text-center text-sm text-default-400">
                    +{goals.length - 5} more
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Profile Completion Tip */}
      {(!user.school || !user.major || subjects.length === 0) && (
        <Card className="border-primary">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  Complete Your Profile
                </h3>
                <p className="text-default-500 mb-4">
                  Add your school, major, and subjects to help others find you
                  and make better connections.
                </p>
                <Button as={Link} href="/profile" color="primary" variant="flat">
                  Complete Profile
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </section>
  );
}

