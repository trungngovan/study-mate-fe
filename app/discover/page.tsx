"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Slider } from "@heroui/slider";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { apiClient } from "@/lib/api-client";
import { useLocation } from "@/lib/use-location";
import type { NearbyLearner } from "@/types/api";
import { title } from "@/components/primitives";

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [nearbyLearners, setNearbyLearners] = useState<NearbyLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10); // Default page size from API
  const [selectedLearner, setSelectedLearner] = useState<NearbyLearner | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { updateLocation, loading: locationLoading, error: locationError } = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadNearbyLearners();
    }
  }, [user, authLoading, router]);

  const loadNearbyLearners = async (searchRadius?: number, page?: number, forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      // Update location (uses cached if fresh, only requests new if needed)
      await updateLocation(forceRefresh);
      
      // Then fetch nearby learners
      const data = await apiClient.getNearbyLearners(searchRadius || radius, page || currentPage);
      setNearbyLearners(Array.isArray(data.results) ? data.results : []);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch nearby learners:", error);
      setNearbyLearners([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (value: number | number[]) => {
    const newRadius = Array.isArray(value) ? value[0] : value;
    setRadius(newRadius);
  };

  const handleRadiusChangeEnd = (value: number | number[]) => {
    const newRadius = Array.isArray(value) ? value[0] : value;
    setCurrentPage(1); // Reset to page 1 when radius changes
    loadNearbyLearners(newRadius, 1, false); // Only call API when user finishes dragging
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadNearbyLearners(radius, page, false);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openConnectionModal = (learner: NearbyLearner) => {
    setSelectedLearner(learner);
    setConnectionMessage(`Hi ${learner.full_name}! I'd love to connect and study together.`);
    onOpen();
  };

  const sendConnectionRequest = async () => {
    if (!selectedLearner) return;

    setSendingRequest(true);
    try {
      await apiClient.sendConnectionRequest({
        receiver_id: selectedLearner.id,
        message: connectionMessage,
      });
      
      // Remove the learner from the list
      setNearbyLearners(prev => prev.filter(l => l.id !== selectedLearner.id));
      
      onClose();
      setConnectionMessage("");
      setSelectedLearner(null);
    } catch (error) {
      console.error("Failed to send connection request:", error);
      alert("Failed to send connection request. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  if (authLoading) {
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
    <section className="py-8 md:py-10 space-y-6">
      <div>
        <h1 className={title()}>Discover Study Buddies</h1>
        <p className="text-default-500 mt-2">
          Find learners near you who share your interests
        </p>
      </div>

      {/* Radius Filter */}
      <Card>
        <CardBody className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-semibold">Search Radius</label>
              <span className="text-primary font-bold">{radius} km</span>
            </div>
            <Slider
              size="sm"
              step={1}
              minValue={1}
              maxValue={50}
              value={radius}
              onChange={handleRadiusChange}
              onChangeEnd={handleRadiusChangeEnd}
              className="max-w-full"
              color="primary"
              aria-label="Search radius in kilometers"
            />
            <p className="text-sm text-default-500">
              Adjust the radius to expand or narrow your search area
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Location Error */}
      {locationError && (
        <Card className="bg-warning-50 border-warning-200">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h4 className="font-semibold text-warning-800">Location Issue</h4>
                <p className="text-sm text-warning-700 mt-1">{locationError}</p>
                <Button
                  size="sm"
                  color="warning"
                  variant="flat"
                  className="mt-2"
                  onClick={() => loadNearbyLearners(radius, currentPage, true)}
                >
                  Retry with Location
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : nearbyLearners.length === 0 ? (
        <Card>
          <CardBody className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No learners found</h3>
            <p className="text-default-500 mb-4">
              Try increasing your search radius or check back later
            </p>
            <Button
              color="primary"
              variant="flat"
              onClick={() => loadNearbyLearners(radius, currentPage, true)}
            >
              Refresh with New Location
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-default-500">
              Found <span className="font-semibold text-foreground">{totalCount}</span> learner{totalCount !== 1 ? 's' : ''} nearby
              {totalCount > pageSize && (
                <span className="text-sm ml-1">(showing {nearbyLearners.length} on page {currentPage})</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                onClick={() => loadNearbyLearners(radius, currentPage, false)}
              >
                Refresh
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onClick={() => loadNearbyLearners(radius, currentPage, true)}
                isLoading={locationLoading}
              >
                Update Location
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyLearners.map((learner) => (
              <Card key={learner.id} className="hover:scale-105 transition-transform">
                <CardHeader className="pb-0 pt-6 px-6">
                  <div className="w-full">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{learner.full_name}</h3>
                        <p className="text-sm text-default-500">
                          {learner.distance_km.toFixed(2)} km away
                        </p>
                      </div>
                      <Chip size="sm" color="primary" variant="flat">
                        {learner.distance_km < 1 ? "Nearby" : `${Math.round(learner.distance_km)} km`}
                      </Chip>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="px-6 py-4">
                  <div className="space-y-3">
                    {learner.school_name && (
                      <div>
                        <p className="text-sm text-default-500">School</p>
                        <p className="font-medium">{learner.school_name}</p>
                      </div>
                    )}
                    
                    {learner.major && (
                      <div>
                        <p className="text-sm text-default-500">Major</p>
                        <p className="font-medium">{learner.major}</p>
                      </div>
                    )}

                    {learner.bio && (
                      <div>
                        <p className="text-sm text-default-500">Bio</p>
                        <p className="text-sm line-clamp-2">{learner.bio}</p>
                      </div>
                    )}
                  </div>
                </CardBody>
                <CardFooter className="pt-0 px-6 pb-6">
                  <Button
                    color="primary"
                    className="w-full"
                    onClick={() => openConnectionModal(learner)}
                  >
                    Send Connection Request
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={Math.ceil(totalCount / pageSize)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showControls
                showShadow
              />
            </div>
          )}
        </>
      )}

      {/* Connection Request Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            Send Connection Request to {selectedLearner?.full_name}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-default-500 mb-2">
                  Introduce yourself and explain why you'd like to connect:
                </p>
                <Textarea
                  label="Connection Message"
                  value={connectionMessage}
                  onChange={(e) => setConnectionMessage(e.target.value)}
                  placeholder="Write a friendly message..."
                  minRows={4}
                  variant="bordered"
                  aria-label="Connection request message"
                />
              </div>
              <p className="text-xs text-default-400">
                A personalized message increases your chances of getting accepted!
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={sendConnectionRequest}
              isLoading={sendingRequest}
              isDisabled={!connectionMessage.trim()}
            >
              Send Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}

