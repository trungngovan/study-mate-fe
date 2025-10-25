"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Avatar } from "@heroui/avatar";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { apiClient } from "@/lib/api-client";
import { useChatWebSocket } from "@/lib/use-chat-websocket";
import type { Conversation, Message } from "@/types/api";

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = parseInt(params.id as string);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Memoize scroll function
  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Memoize WebSocket callbacks to prevent reconnections
  const handleMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
    
    // Scroll to bottom for new messages
    setTimeout(() => scrollToBottom(), 100);
  }, [scrollToBottom]);

  const handleTyping = useCallback((userId: number, userName: string, isTyping: boolean) => {
    if (userId === user?.id) return; // Ignore own typing
    
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      if (isTyping) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, [user?.id]);

  const handleMessagesRead = useCallback((userId: number, messageIds: number[]) => {
    if (userId === user?.id) return; // Ignore own read receipts
    
    setMessages((prev) =>
      prev.map((msg) =>
        messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
      )
    );
  }, [user?.id]);

  const handleError = useCallback((error: string) => {
    console.error("WebSocket error:", error);
  }, []);

  // WebSocket connection with stable callbacks - only initialize when user is ready
  const shouldInitWebSocket = !!user && !authLoading;
  const { sendMessage: wsSendMessage, sendTyping, markAsRead, isConnected, reconnect } = useChatWebSocket({
    conversationId,
    onMessage: handleMessage,
    onTyping: handleTyping,
    onMessagesRead: handleMessagesRead,
    onError: handleError,
    enabled: shouldInitWebSocket, // Only connect when user is ready
  });

  // Separate useEffect for marking messages as read
  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.is_read && msg.sender_id !== user?.id);
    if (unreadMessages.length > 0 && isConnected) {
      const messageIds = unreadMessages.map(msg => msg.id);
      const timer = setTimeout(() => {
        markAsRead(messageIds);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages, user?.id, isConnected, markAsRead]);

  // Load conversation data
  const loadConversationData = useCallback(async () => {
    setLoading(true);
    try {
      const [conversationData, messagesData] = await Promise.all([
        apiClient.getConversation(conversationId),
        apiClient.getMessages(conversationId, 1, 50),
      ]);
      
      setConversation(conversationData);
      setMessages(messagesData.results);
      setHasMore(!!messagesData.next);
      setCurrentPage(1);
      
      // Mark unread messages as read via API (WebSocket will handle real-time)
      const unreadMessageIds = messagesData.results
        .filter(msg => !msg.is_read && msg.sender_id !== user?.id)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        setTimeout(() => {
          apiClient.markMessagesAsRead(conversationId, unreadMessageIds).catch(console.error);
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      router.push("/chat");
    } finally {
      setLoading(false);
      if (initialLoadRef.current) {
        setTimeout(() => scrollToBottom(true), 100);
        initialLoadRef.current = false;
      }
    }
  }, [conversationId, user?.id, router, scrollToBottom]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load data only when user is ready and conversationId exists
  useEffect(() => {
    if (user && conversationId) {
      loadConversationData();
    }
  }, [user, conversationId, loadConversationData]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const messagesData = await apiClient.getMessages(conversationId, nextPage, 50);
      
      // Prepend older messages to the beginning of the array
      setMessages((prev) => [...messagesData.results, ...prev]);
      setHasMore(!!messagesData.next);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSending) return;
    
    const content = messageInput.trim();
    setMessageInput("");
    setIsSending(true);
    
    try {
      if (isConnected) {
        // Send via WebSocket
        wsSendMessage(content);
      } else {
        // Fallback to HTTP
        const newMessage = await apiClient.sendMessage({
          conversation: conversationId,
          content,
        });
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageInput(content); // Restore message on error
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    if (isConnected) {
      sendTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    
    return currentDate !== prevDate;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || !conversation) {
    return null;
  }

  const otherParticipant = conversation.other_participant;

  return (
    <section className="py-4 md:py-6 h-[calc(100vh-8rem)]">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="pb-3 pt-4 px-6 border-b border-divider flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() => router.push("/chat")}
              >
                ←
              </Button>
              <Avatar
                name={otherParticipant.full_name}
                src={otherParticipant.avatar_url}
                size="md"
                color="primary"
              />
              <div>
                <h2 className="text-lg font-bold">{otherParticipant.full_name}</h2>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Chip size="sm" color="success" variant="dot">Connected</Chip>
                  ) : (
                    <Chip size="sm" color="warning" variant="dot">Connecting...</Chip>
                  )}
                </div>
              </div>
            </div>
            
            {!isConnected && (
              <Button
                size="sm"
                variant="flat"
                onClick={reconnect}
              >
                Reconnect
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Messages Container */}
        <CardBody className="flex-1 overflow-y-auto p-0">
          <div ref={messagesContainerRef} className="p-6 space-y-4">
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button
                size="sm"
                variant="flat"
                onClick={loadMoreMessages}
                isLoading={loadingMore}
              >
                Load Earlier Messages
              </Button>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user.id;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showDate = shouldShowDateSeparator(message, prevMessage);

            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <Chip size="sm" variant="flat">
                      {formatMessageDate(message.created_at)}
                    </Chip>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {!isOwnMessage && (
                      <Avatar
                        name={message.sender_name || otherParticipant.full_name}
                        src={message.sender_avatar || otherParticipant.avatar_url}
                        size="sm"
                        color="primary"
                      />
                    )}
                    
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-default-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 px-2">
                        <span className="text-xs text-default-400">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isOwnMessage && message.is_read && (
                          <span className="text-xs text-primary">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <div className="flex items-start gap-2">
              <Avatar
                name={otherParticipant.full_name}
                src={otherParticipant.avatar_url}
                size="sm"
                color="primary"
              />
              <div className="bg-default-100 rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        </CardBody>

        {/* Input Area */}
        <div className="border-t border-divider p-4 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message..."
              variant="bordered"
              size="lg"
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isSending}
              isDisabled={!messageInput.trim() || isSending}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </section>
  );
}

