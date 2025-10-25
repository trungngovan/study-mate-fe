"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Pagination } from "@heroui/pagination";
import { apiClient } from "@/lib/api-client";
import type { ConnectionRequest, Connection, Conversation } from "@/types/api";
import { title } from "@/components/primitives";

export default function ConnectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("connections");
  
  // Data states
  const [connections, setConnections] = useState<Connection[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Pagination states
  const [connectionsPage, setConnectionsPage] = useState(1);
  const [connectionsTotalPages, setConnectionsTotalPages] = useState(1);
  const [connectionsTotal, setConnectionsTotal] = useState(0);
  const [receivedPage, setReceivedPage] = useState(1);
  const [receivedTotalPages, setReceivedTotalPages] = useState(1);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [sentPage, setSentPage] = useState(1);
  const [sentTotalPages, setSentTotalPages] = useState(1);
  const [sentTotal, setSentTotal] = useState(0);
  
  const pageSize = 10;
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [messageLoading, setMessageLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadConnectionsData();
    }
  }, [user, authLoading, router, activeTab, connectionsPage, receivedPage, sentPage]);

  const loadConnectionsData = async (tabToLoad?: string) => {
    const tab = tabToLoad || activeTab;
    setLoading(true);
    try {
      if (tab === "connections") {
        const [connectionsData, conversationsData] = await Promise.all([
          apiClient.getConnections({ page: connectionsPage, page_size: pageSize }),
          apiClient.getConversations(),
        ]);
        setConnections(connectionsData.results || []);
        setConnectionsTotal(connectionsData.count);
        setConnectionsTotalPages(Math.ceil(connectionsData.count / pageSize));
        setConversations(conversationsData);
      } else if (tab === "received") {
        const receivedData = await apiClient.getReceivedRequests({ 
          state: 'pending', 
          page: receivedPage, 
          page_size: pageSize 
        });
        setReceivedRequests(receivedData.results || []);
        setReceivedTotal(receivedData.count);
        setReceivedTotalPages(Math.ceil(receivedData.count / pageSize));
      } else if (tab === "sent") {
        const sentData = await apiClient.getSentRequests({ 
          state: 'pending', 
          page: sentPage, 
          page_size: pageSize 
        });
        setSentRequests(sentData.results || []);
        setSentTotal(sentData.count);
        setSentTotalPages(Math.ceil(sentData.count / pageSize));
      }
    } catch (error) {
      console.error("Failed to load connections data:", error);
      if (tab === "connections") setConnections([]);
      if (tab === "received") setReceivedRequests([]);
      if (tab === "sent") setSentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await apiClient.acceptRequest(requestId);
      // Reload data to reflect changes
      await loadConnectionsData();
    } catch (error) {
      console.error("Failed to accept request:", error);
      alert("Failed to accept request. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await apiClient.rejectRequest(requestId);
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error("Failed to reject request:", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await apiClient.cancelRequest(requestId);
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error("Failed to cancel request:", error);
      alert("Failed to cancel request. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const getConversationForConnection = (connection: Connection): Conversation | undefined => {
    return conversations.find(
      conv => conv.other_participant.id === connection.user?.id
    );
  };

  const handleMessageClick = async (connection: Connection) => {
    if (!connection.id) return;
    
    setMessageLoading(connection.id);
    
    try {
      // First check if conversation already exists
      let conversation = getConversationForConnection(connection);
      
      if (conversation) {
        router.push(`/chat/${conversation.id}`);
        return;
      }

      // If not found, try refreshing conversations list
      // (conversation might have just been created by backend)
      const conversationsData = await apiClient.getConversations();
      const conversationsArray = Array.isArray(conversationsData) ? conversationsData : [];
      setConversations(conversationsArray);
      
      // Check again after refresh
      conversation = conversationsArray.find(
        conv => conv.other_participant.id === connection.user?.id
      );
      
      if (conversation) {
        router.push(`/chat/${conversation.id}`);
      } else {
        // Still no conversation found - this means backend hasn't created it yet
        // This could happen if conversations are only created on first message
        alert(
          "Conversation not available yet. This might be a backend issue - " +
          "conversations should be automatically created when connections are accepted. " +
          "Please contact support or try refreshing the page."
        );
        console.error("No conversation found for connection:", connection);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      alert("Failed to load conversations. Please try again.");
    } finally {
      setMessageLoading(null);
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
    <section className="py-8 md:py-10 space-y-6">
      <div>
        <h1 className={title()}>My Connections</h1>
        <p className="text-default-500 mt-2">
          Manage your study network and connection requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {connectionsTotal}
            </div>
            <div className="text-default-500">Active Connections</div>
          </CardBody>
        </Card>

        <Card className={receivedTotal > 0 ? "border-success" : ""}>
          <CardBody className="p-6 text-center">
            <div className="text-3xl font-bold text-success mb-2">
              {receivedTotal}
            </div>
            <div className="text-default-500">Pending Requests</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-3xl font-bold text-warning mb-2">
              {sentTotal}
            </div>
            <div className="text-default-500">Sent Requests</div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key.toString())}
            classNames={{
              base: "w-full",
              tabList: "w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-6 h-12",
            }}
          >
            <Tab
              key="connections"
              title={
                <div className="flex items-center gap-2">
                  <span>Connections</span>
                  <Chip size="sm" variant="flat">
                    {connectionsTotal}
                  </Chip>
                </div>
              }
            >
              <div className="p-6 space-y-4">
                {connections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤝</div>
                    <h3 className="text-xl font-bold mb-2">No connections yet</h3>
                    <p className="text-default-500 mb-4">
                      Start discovering and connecting with study buddies
                    </p>
                    <Button
                      color="primary"
                      onClick={() => router.push("/discover")}
                    >
                      Discover Learners
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((connection) => (
                      <Card key={connection.id} className="border-default-200">
                        <CardBody className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <Avatar
                                name={connection.user?.full_name || "Unknown"}
                                size="lg"
                                color="primary"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="font-bold text-lg truncate">
                                    {connection.user?.full_name || "Unknown User"}
                                  </h4>
                                  <Chip size="sm" color="success" variant="flat">
                                    Connected
                                  </Chip>
                                </div>
                                {connection.user?.school_name && (
                                  <p className="text-sm text-default-500">
                                    {connection.user.school_name}
                                  </p>
                                )}
                                {connection.user?.major && (
                                  <p className="text-sm text-default-500">
                                    {connection.user.major}
                                  </p>
                                )}
                                {connection.user?.bio && (
                                  <p className="text-sm mt-2 line-clamp-2">
                                    {connection.user.bio}
                                  </p>
                                )}
                                {connection.can_message && (
                                  <div className="mt-3">
                                    <Button
                                      size="sm"
                                      color="primary"
                                      onClick={() => handleMessageClick(connection)}
                                      isLoading={messageLoading === connection.id}
                                    >
                                      💬 Send Message
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Pagination for Connections */}
                {connectionsTotalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={connectionsTotalPages}
                      page={connectionsPage}
                      onChange={setConnectionsPage}
                      showControls
                      color="primary"
                    />
                  </div>
                )}
              </div>
            </Tab>

            <Tab
              key="received"
              title={
                <div className="flex items-center gap-2">
                  <span>Received</span>
                  {receivedTotal > 0 && (
                    <Chip size="sm" color="success" variant="flat">
                      {receivedTotal}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="p-6 space-y-4">
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-12 text-default-400">
                    <div className="text-6xl mb-4">📬</div>
                    <h3 className="text-xl font-bold mb-2">No pending requests</h3>
                    <p className="text-default-500">
                      You'll see connection requests from other learners here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedRequests.map((request) => (
                      <Card key={request.id} className="border-success">
                        <CardBody className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar
                              name={request.sender?.full_name || request.sender_name || "Unknown"}
                              src={request.sender?.avatar_url || request.sender_avatar || undefined}
                              size="lg"
                              color="success"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold text-lg">
                                    {request.sender?.full_name || request.sender_name || "Unknown User"}
                                  </h4>
                                  {request.sender?.school_name && (
                                    <p className="text-sm text-default-500">
                                      {request.sender.school_name}
                                    </p>
                                  )}
                                  {request.sender?.major && (
                                    <p className="text-sm text-default-500">
                                      {request.sender.major}
                                    </p>
                                  )}
                                </div>
                                <Chip size="sm" color="warning" variant="flat">
                                  Pending
                                </Chip>
                              </div>
                              
                              {request.message && (
                                <div className="bg-default-100 rounded-lg p-3 mb-4">
                                  <p className="text-sm">{request.message}</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  color="success"
                                  size="sm"
                                  onClick={() => handleAcceptRequest(request.id)}
                                  isLoading={actionLoading === request.id}
                                >
                                  Accept
                                </Button>
                                <Button
                                  color="danger"
                                  variant="flat"
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id)}
                                  isLoading={actionLoading === request.id}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Pagination for Received Requests */}
                {receivedTotalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={receivedTotalPages}
                      page={receivedPage}
                      onChange={setReceivedPage}
                      showControls
                      color="success"
                    />
                  </div>
                )}
              </div>
            </Tab>

            <Tab
              key="sent"
              title={
                <div className="flex items-center gap-2">
                  <span>Sent</span>
                  {sentTotal > 0 && (
                    <Chip size="sm" variant="flat">
                      {sentTotal}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="p-6 space-y-4">
                {sentRequests.length === 0 ? (
                  <div className="text-center py-12 text-default-400">
                    <div className="text-6xl mb-4">📤</div>
                    <h3 className="text-xl font-bold mb-2">No sent requests</h3>
                    <p className="text-default-500 mb-4">
                      Send connection requests to learners you'd like to study with
                    </p>
                    <Button
                      color="primary"
                      onClick={() => router.push("/discover")}
                    >
                      Discover Learners
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <Card key={request.id}>
                        <CardBody className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar
                              name={request.receiver?.full_name || request.receiver_name || "Unknown"}
                              src={request.receiver?.avatar_url || request.receiver_avatar || undefined}
                              size="lg"
                              color="primary"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold text-lg">
                                    {request.receiver?.full_name || request.receiver_name || "Unknown User"}
                                  </h4>
                                  {request.receiver?.school_name && (
                                    <p className="text-sm text-default-500">
                                      {request.receiver.school_name}
                                    </p>
                                  )}
                                  {request.receiver?.major && (
                                    <p className="text-sm text-default-500">
                                      {request.receiver.major}
                                    </p>
                                  )}
                                </div>
                                <Chip size="sm" color="warning" variant="flat">
                                  Pending
                                </Chip>
                              </div>
                              
                              {request.message && (
                                <div className="bg-default-100 rounded-lg p-3 mb-4">
                                  <p className="text-sm italic">"{request.message}"</p>
                                </div>
                              )}

                              <div className="flex items-center gap-4">
                                <p className="text-xs text-default-400">
                                  Sent {new Date(request.created_at).toLocaleDateString()}
                                </p>
                                <Button
                                  color="danger"
                                  variant="flat"
                                  size="sm"
                                  onClick={() => handleCancelRequest(request.id)}
                                  isLoading={actionLoading === request.id}
                                >
                                  Cancel Request
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Pagination for Sent Requests */}
                {sentTotalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={sentTotalPages}
                      page={sentPage}
                      onChange={setSentPage}
                      showControls
                      color="warning"
                    />
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </section>
  );
}

