"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Input } from "@heroui/input";
import { apiClient } from "@/lib/api-client";
import type { Conversation } from "@/types/api";
import { title } from "@/components/primitives";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadConversations();
    }
  }, [user, authLoading, router, currentPage]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getConversations();
      const allConversations = Array.isArray(data) ? data : [];
      
      // Filter conversations based on search query
      const filteredConversations = searchQuery
        ? allConversations.filter((conv) =>
            conv.other_participant.full_name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
        : allConversations;
      
      // Calculate pagination
      const total = Math.ceil(filteredConversations.length / pageSize);
      setTotalPages(total);
      
      // Get current page conversations
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setConversations(filteredConversations.slice(startIndex, endIndex));
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Reload conversations when search query changes
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [searchQuery]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) {
      return "Just now";
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={title()}>Messages</h1>
          <p className="text-default-500 mt-2">
            Chat with your study buddies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            variant="bordered"
            className="w-64"
            startContent={
              <svg
                className="w-4 h-4 text-default-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            isClearable
            onClear={() => setSearchQuery("")}
          />
          <Button
            size="sm"
            variant="flat"
            onClick={loadConversations}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardBody className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-2">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </h3>
              <p className="text-default-500 mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Connect with learners to start chatting"}
              </p>
              {!searchQuery && (
                <Button
                  color="primary"
                  onClick={() => router.push("/discover")}
                >
                  Find Study Buddies
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Conversations List */}
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    isPressable
                    onPress={() => router.push(`/chat/${conversation.id}`)}
                    className="border-default-200 w-full"
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start gap-4 w-full">
                        <div className="relative flex-shrink-0">
                          <Avatar
                            name={conversation.other_participant.full_name}
                            src={conversation.other_participant.avatar_url}
                            size="lg"
                            color="primary"
                          />
                          {conversation.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 gap-3">
                            <h4 className="font-bold text-lg truncate">
                              {conversation.other_participant.full_name}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-default-400">
                                {formatTime(conversation.last_message_at)}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Chip size="sm" color="danger" variant="flat">
                                  {conversation.unread_count} new
                                </Chip>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'font-semibold' : 'text-default-500'}`}>
                            {conversation.last_message_preview?.sender_id === user.id && "You: "}
                            {conversation.last_message_preview?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-2">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    showControls
                    color="primary"
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </section>
  );
}

