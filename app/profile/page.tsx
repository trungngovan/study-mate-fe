"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Pagination } from "@heroui/pagination";
import { apiClient } from "@/lib/api-client";
import type { User, School, UserSubject, UserGoal, Subject, Goal, LocationHistory, LocationStats } from "@/types/api";
import { title } from "@/components/primitives";

export default function ProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<User>>({});
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userSubjects, setUserSubjects] = useState<UserSubject[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Location history state
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [historyDays, setHistoryDays] = useState(30);
  
  // Subject modal state
  const { isOpen: isSubjectModalOpen, onOpen: onSubjectModalOpen, onClose: onSubjectModalClose } = useDisclosure();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectLevel, setSubjectLevel] = useState<string>("beginner");
  const [subjectIntent, setSubjectIntent] = useState<string>("learn");
  const [subjectNotes, setSubjectNotes] = useState("");
  
  // Goal modal state
  const { isOpen: isGoalModalOpen, onOpen: onGoalModalOpen, onClose: onGoalModalClose } = useDisclosure();
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [goalTargetValue, setGoalTargetValue] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalNotes, setGoalNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadProfileData();
    }
  }, [user, authLoading, router]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [profileData, schoolsData, subjectsData, goalsData, userSubjectsData, userGoalsData] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getSchools({}),
        apiClient.getSubjects({}),
        apiClient.getGoals({}),
        apiClient.getUserSubjects(),
        apiClient.getUserGoals(),
      ]);
      
      setProfile(profileData);
      setSchools(Array.isArray(schoolsData.results) ? schoolsData.results : []);
      setSubjects(Array.isArray(subjectsData.results) ? subjectsData.results : []);
      setGoals(Array.isArray(goalsData.results) ? goalsData.results : []);
      setUserSubjects(Array.isArray(userSubjectsData) ? userSubjectsData : []);
      setUserGoals(Array.isArray(userGoalsData) ? userGoalsData : []);
      
      // Load location data
      loadLocationData();
    } catch (error) {
      console.error("Failed to load profile data:", error);
      setSchools([]);
      setSubjects([]);
      setGoals([]);
      setUserSubjects([]);
      setUserGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocationData = async (page: number = 1) => {
    setLocationLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        apiClient.getLocationHistory({ limit: 10, page }),
        apiClient.getLocationStats(historyDays),
      ]);
      
      setLocationHistory(Array.isArray(historyData.results) ? historyData.results : []);
      setTotalCount(historyData.count || 0);
      setTotalPages(Math.ceil((historyData.count || 0) / 10));
      setHistoryPage(page);
      setLocationStats(statsData);
    } catch (error) {
      console.error("Failed to load location data:", error);
      setLocationHistory([]);
      setLocationStats(null);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadLocationData(page);
  };

  const handleDaysChange = (days: number) => {
    setHistoryDays(days);
    setHistoryPage(1);
    loadLocationData(1);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updatedProfile = await apiClient.updateProfile(profile);
      updateUser(updatedProfile);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubjectId) return;
    
    try {
      const newSubject = await apiClient.addUserSubject({
        subject: parseInt(selectedSubjectId),
        level: subjectLevel as "beginner" | "intermediate" | "advanced" | "expert",
        intent: subjectIntent as "learn" | "teach" | "both",
        note: subjectNotes,
      });
      
      setUserSubjects([...userSubjects, newSubject]);
      onSubjectModalClose();
      setSelectedSubjectId("");
      setSubjectLevel("beginner");
      setSubjectIntent("learn");
      setSubjectNotes("");
    } catch (error) {
      console.error("Failed to add subject:", error);
      alert("Failed to add subject. Please try again.");
    }
  };

  const handleRemoveSubject = async (id: number) => {
    try {
      await apiClient.deleteUserSubject(id);
      setUserSubjects(userSubjects.filter(s => s.id !== id));
    } catch (error) {
      console.error("Failed to remove subject:", error);
      alert("Failed to remove subject. Please try again.");
    }
  };

  const handleAddGoal = async () => {
    if (!selectedGoalId || !goalTargetValue || !goalTargetDate) return;
    
    try {
      const newGoal = await apiClient.addUserGoal({
        goal: parseInt(selectedGoalId),
        target_value: parseFloat(goalTargetValue),
        target_date: goalTargetDate,
      });
      
      setUserGoals([...userGoals, newGoal]);
      onGoalModalClose();
      setSelectedGoalId("");
      setGoalTargetValue("");
      setGoalTargetDate("");
      setGoalNotes("");
    } catch (error) {
      console.error("Failed to add goal:", error);
      alert("Failed to add goal. Please try again.");
    }
  };

  const handleRemoveGoal = async (id: number) => {
    try {
      await apiClient.deleteUserGoal(id);
      setUserGoals(userGoals.filter(g => g.id !== id));
    } catch (error) {
      console.error("Failed to remove goal:", error);
      alert("Failed to remove goal. Please try again.");
    }
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
        <h1 className={title()}>My Profile</h1>
        <p className="text-default-500 mt-2">
          Manage your profile information and preferences
        </p>
      </div>

      {/* Basic Information */}
      <Card id="basic-info">
        <CardHeader className="pb-0 pt-6 px-6">
          <h2 className="text-xl font-bold">Basic Information</h2>
        </CardHeader>
        <CardBody className="p-6 space-y-4">
          <Input
            label="Full Name"
            value={profile.full_name || ""}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            variant="bordered"
          />
          
          <Input
            label="Email"
            type="email"
            value={profile.email || ""}
            isReadOnly
            variant="bordered"
            description="Email cannot be changed"
          />
          
          <Textarea
            label="Bio"
            value={profile.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            variant="bordered"
            placeholder="Tell others about yourself..."
            minRows={3}
          />
          
          <Select
            label="School"
            placeholder="Select your school"
            selectedKeys={profile.school ? [profile.school.toString()] : []}
            onChange={(e) => setProfile({ ...profile, school: e.target.value ? parseInt(e.target.value) : undefined })}
            variant="bordered"
          >
            {schools.map((school) => (
              <SelectItem key={school.id.toString()}>
                {school.name}
              </SelectItem>
            ))}
          </Select>
          
          <Input
            label="Major"
            value={profile.major || ""}
            onChange={(e) => setProfile({ ...profile, major: e.target.value })}
            variant="bordered"
            placeholder="e.g. Computer Science"
          />
          
          <Input
            label="Learning Radius (km)"
            type="number"
            value={profile.learning_radius_km?.toString() || "5"}
            onChange={(e) => setProfile({ ...profile, learning_radius_km: parseFloat(e.target.value) })}
            variant="bordered"
            description="Default search radius for discovering nearby learners"
            min={1}
            max={50}
          />
          
          <Button
            color="primary"
            onClick={handleSaveProfile}
            isLoading={saving}
            className="w-full md:w-auto"
          >
            Save Changes
          </Button>
        </CardBody>
      </Card>

      {/* Subjects */}
      <Card id="subjects">
        <CardHeader className="pb-0 pt-6 px-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">My Subjects</h2>
          <Button color="primary" size="sm" onClick={onSubjectModalOpen}>
            Add Subject
          </Button>
        </CardHeader>
        <CardBody className="p-6">
          {userSubjects.length === 0 ? (
            <div className="text-center py-8 text-default-400">
              <p>No subjects added yet</p>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                className="mt-4"
                onClick={onSubjectModalOpen}
              >
                Add Your First Subject
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userSubjects.map((userSubject) => (
                <Card key={userSubject.id} className="border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">
                          {userSubject.subject_name_en || userSubject.subject_code || `Subject #${userSubject.subject}`}
                        </h4>
                        <div className="flex gap-2 mb-2">
                          <Chip size="sm" color="primary" variant="flat">
                            {userSubject.level}
                          </Chip>
                          <Chip size="sm" color="secondary" variant="flat">
                            {userSubject.intent}
                          </Chip>
                        </div>
                        {userSubject.note && (
                          <p className="text-sm text-default-500">{userSubject.note}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onClick={() => handleRemoveSubject(userSubject.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Goals */}
      <Card id="goals">
        <CardHeader className="pb-0 pt-6 px-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">My Goals</h2>
          <Button color="primary" size="sm" onClick={onGoalModalOpen}>
            Add Goal
          </Button>
        </CardHeader>
        <CardBody className="p-6">
          {userGoals.length === 0 ? (
            <div className="text-center py-8 text-default-400">
              <p>No goals added yet</p>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                className="mt-4"
                onClick={onGoalModalOpen}
              >
                Add Your First Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userGoals.map((userGoal) => (
                <Card key={userGoal.id} className="border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">
                          {userGoal.goal_name || `Goal #${userGoal.goal}`}
                        </h4>
                        {userGoal.target_value && (
                          <p className="text-sm text-default-500 mb-1">
                            Target: {userGoal.target_value}
                          </p>
                        )}
                        {userGoal.target_date && (
                          <p className="text-sm text-default-500 mb-1">
                            Date:{" "}
                            {new Date(userGoal.target_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onClick={() => handleRemoveGoal(userGoal.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Subject Modal */}
      <Modal isOpen={isSubjectModalOpen} onClose={onSubjectModalClose} size="lg">
        <ModalContent>
          <ModalHeader>Add Subject</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Subject"
                placeholder="Select a subject"
                selectedKeys={selectedSubjectId ? [selectedSubjectId] : []}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                variant="bordered"
                isRequired
              >
                {subjects.map((subject) => (
                  <SelectItem key={subject.id.toString()}>
                    {subject.name_en}
                  </SelectItem>
                ))}
              </Select>
              
              <Select
                label="Level"
                selectedKeys={[subjectLevel]}
                onChange={(e) => setSubjectLevel(e.target.value)}
                variant="bordered"
              >
                <SelectItem key="beginner">Beginner</SelectItem>
                <SelectItem key="intermediate">Intermediate</SelectItem>
                <SelectItem key="advanced">Advanced</SelectItem>
                <SelectItem key="expert">Expert</SelectItem>
              </Select>
              
              <Select
                label="Intent"
                selectedKeys={[subjectIntent]}
                onChange={(e) => setSubjectIntent(e.target.value)}
                variant="bordered"
              >
                <SelectItem key="learn">Learn</SelectItem>
                <SelectItem key="teach">Teach</SelectItem>
                <SelectItem key="both">Both</SelectItem>
              </Select>
              
              <Textarea
                label="Note (Optional)"
                value={subjectNotes}
                onChange={(e) => setSubjectNotes(e.target.value)}
                variant="bordered"
                placeholder="Add any additional note..."
                minRows={2}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onSubjectModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleAddSubject}
              isDisabled={!selectedSubjectId}
            >
              Add Subject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={onGoalModalClose} size="lg">
        <ModalContent>
          <ModalHeader>Add Goal</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Goal"
                placeholder="Select a goal"
                selectedKeys={selectedGoalId ? [selectedGoalId] : []}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                variant="bordered"
                isRequired
              >
                {goals.map((goal) => (
                  <SelectItem key={goal.id.toString()}>
                    {goal.name}
                  </SelectItem>
                ))}
              </Select>
              
              <Input
                label="Target Value"
                type="number"
                placeholder="e.g., 5 for 5 hours/day"
                value={goalTargetValue}
                onChange={(e) => setGoalTargetValue(e.target.value)}
                variant="bordered"
                min={0}
                step={0.1}
                isRequired
                description="Numeric target for this goal"
              />
              
              <Input
                label="Target Date"
                type="date"
                value={goalTargetDate}
                onChange={(e) => setGoalTargetDate(e.target.value)}
                variant="bordered"
                isRequired
                description="When you want to achieve this goal"
              />
              
              <Textarea
                label="Notes (Optional)"
                value={goalNotes}
                onChange={(e) => setGoalNotes(e.target.value)}
                variant="bordered"
                placeholder="Add any additional notes..."
                minRows={2}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onGoalModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleAddGoal}
              isDisabled={!selectedGoalId || !goalTargetValue || !goalTargetDate}
            >
              Add Goal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Location History */}
      <Accordion variant="bordered" id="location-history">
        <AccordionItem
          key="location-history"
          aria-label="Location History"
          title={
            <div className="flex items-center justify-between w-full pr-4">
              <h2 className="text-xl font-bold">📍 Location History</h2>
              {locationStats && (
                <Chip size="sm" color="primary" variant="flat">
                  {locationStats.total_records} records
                </Chip>
              )}
            </div>
          }
        >
          <div className="px-4 pb-4 space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-default-600">Time Period:</span>
                <Select
                  size="sm"
                  selectedKeys={[historyDays.toString()]}
                  onChange={(e) => handleDaysChange(parseInt(e.target.value))}
                  className="min-w-[140px]"
                  variant="bordered"
                  aria-label="Select time period"
                  disallowEmptySelection
                  classNames={{
                    trigger: "min-w-[140px]",
                    value: "text-small"
                  }}
                >
                  <SelectItem key="7">Last 7 days</SelectItem>
                  <SelectItem key="30">Last 30 days</SelectItem>
                  <SelectItem key="90">Last 90 days</SelectItem>
                </Select>
              </div>
              <Button
                color="primary"
                size="sm"
                variant="flat"
                onClick={() => loadLocationData(historyPage)}
                isLoading={locationLoading}
              >
                Refresh
              </Button>
            </div>
          {/* Statistics */}
          {locationStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-primary-50 border-primary-200">
                <CardBody className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {locationStats.total_records}
                  </div>
                  <div className="text-sm text-default-600">Total Records</div>
                </CardBody>
              </Card>
              
              <Card className="bg-success-50 border-success-200">
                <CardBody className="p-4 text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {locationStats.days_analyzed}
                  </div>
                  <div className="text-sm text-default-600">Days Analyzed</div>
                </CardBody>
              </Card>
              
              <Card className="bg-warning-50 border-warning-200">
                <CardBody className="p-4 text-center">
                  <div className="text-sm font-semibold text-warning-800 mb-1">
                    First Record
                  </div>
                  <div className="text-xs text-default-600">
                    {locationStats.first_recorded 
                      ? new Date(locationStats.first_recorded).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                </CardBody>
              </Card>
              
              <Card className="bg-secondary-50 border-secondary-200">
                <CardBody className="p-4 text-center">
                  <div className="text-sm font-semibold text-secondary-800 mb-1">
                    Last Record
                  </div>
                  <div className="text-xs text-default-600">
                    {locationStats.last_recorded 
                      ? new Date(locationStats.last_recorded).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Current Location */}
          {locationStats?.current_location && (
            <Card className="bg-default-50">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <h4 className="font-semibold">Current Location</h4>
                    <p className="text-sm text-default-600">
                      Lat: {locationStats.current_location.latitude.toFixed(6)}, 
                      Lng: {locationStats.current_location.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* History List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Locations</h3>
              {totalCount > 0 && (
                <span className="text-sm text-default-500">
                  Showing {((historyPage - 1) * 10) + 1} - {Math.min(historyPage * 10, totalCount)} of {totalCount}
                </span>
              )}
            </div>
            
            {locationLoading && locationHistory.length === 0 ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : locationHistory.length === 0 ? (
              <div className="text-center py-8 text-default-400">
                <p>No location history found</p>
                <p className="text-sm mt-2">
                  Your location will be saved when you use the Discover feature
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {locationHistory.map((location) => (
                    <Card key={location.id} className="border-default-200">
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">📌</span>
                              <span className="font-mono text-sm text-default-600 truncate">
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-default-500">
                              <span className="flex items-center gap-1">
                                🕐 {new Date(location.recorded_at).toLocaleString()}
                              </span>
                              {location.accuracy && (
                                <span className="flex items-center gap-1">
                                  🎯 ±{location.accuracy.toFixed(0)}m
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            as="a"
                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            View Map
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-6">
                    <Pagination
                      total={totalPages}
                      page={historyPage}
                      onChange={handlePageChange}
                      color="primary"
                      showControls
                      isDisabled={locationLoading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

