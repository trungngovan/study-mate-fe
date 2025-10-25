import { useEffect, useRef, useCallback, useState } from 'react';
import type { WSMessage, Message } from '@/types/api';

interface UseChatWebSocketOptions {
    conversationId: number;
    onMessage?: (message: Message) => void;
    onTyping?: (userId: number, userName: string, isTyping: boolean) => void;
    onMessagesRead?: (userId: number, messageIds: number[], readAt: string) => void;
    onError?: (error: string) => void;
    enabled?: boolean; // Only connect when true (default: true)
}

interface UseChatWebSocketReturn {
    sendMessage: (content: string) => void;
    sendTyping: (isTyping: boolean) => void;
    markAsRead: (messageIds: number[]) => void;
    isConnected: boolean;
    reconnect: () => void;
}

export function useChatWebSocket({
    conversationId,
    onMessage,
    onTyping,
    onMessagesRead,
    onError,
    enabled = true, // Default to true for backward compatibility
}: UseChatWebSocketOptions): UseChatWebSocketReturn {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const isConnectingRef = useRef(false);
    const shouldReconnectRef = useRef(true); // Control whether to auto-reconnect

    // Store callbacks in refs to avoid recreating connect function
    const onMessageRef = useRef(onMessage);
    const onTypingRef = useRef(onTyping);
    const onMessagesReadRef = useRef(onMessagesRead);
    const onErrorRef = useRef(onError);

    // Update refs when callbacks change
    useEffect(() => {
        onMessageRef.current = onMessage;
        onTypingRef.current = onTyping;
        onMessagesReadRef.current = onMessagesRead;
        onErrorRef.current = onError;
    }, [onMessage, onTyping, onMessagesRead, onError]);

    const connect = useCallback(() => {
        if (typeof window === 'undefined') return;

        // Prevent multiple simultaneous connections
        if (isConnectingRef.current) {
            console.log('Already connecting, skipping...');
            return;
        }

        // Don't connect if already connected
        if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
            console.log('Already connected or connecting, skipping...');
            return;
        }

        // Enable auto-reconnect for this connection
        shouldReconnectRef.current = true;
        isConnectingRef.current = true;

        const token = localStorage.getItem('access_token');
        if (!token) {
            console.error('No access token found');
            isConnectingRef.current = false;
            return;
        }

        const wsBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('http', 'ws');
        const wsUrl = `${wsBaseUrl}/ws/chat/${conversationId}/?token=${token}`;

        try {
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                isConnectingRef.current = false;
                reconnectAttempts.current = 0;
            };

            ws.current.onmessage = (event) => {
                try {
                    const data: WSMessage = JSON.parse(event.data);

                    switch (data.type) {
                        case 'connection_established':
                            console.log('Chat connection established:', data.message);
                            break;

                        case 'chat_message':
                            if (onMessageRef.current && data.message_id && data.sender_id && data.content) {
                                onMessageRef.current({
                                    id: data.message_id,
                                    conversation: conversationId,
                                    sender_id: data.sender_id,
                                    sender_name: data.sender_name,
                                    sender_avatar: data.sender_avatar,
                                    content: data.content,
                                    is_read: false,
                                    created_at: data.created_at || new Date().toISOString(),
                                });
                            }
                            break;

                        case 'typing_indicator':
                            if (onTypingRef.current && data.user_id && data.user_name && data.is_typing !== undefined) {
                                onTypingRef.current(data.user_id, data.user_name, data.is_typing);
                            }
                            break;

                        case 'messages_read':
                            if (onMessagesReadRef.current && data.user_id && data.message_ids && data.read_at) {
                                onMessagesReadRef.current(data.user_id, data.message_ids, data.read_at);
                            }
                            break;

                        case 'error':
                            console.error('WebSocket error:', data.message);
                            if (onErrorRef.current) {
                                onErrorRef.current(data.message || 'Unknown error');
                            }
                            break;
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
                isConnectingRef.current = false;
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                isConnectingRef.current = false;

                // Only auto-reconnect if we should (not intentionally disconnected)
                if (shouldReconnectRef.current && reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current += 1;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                } else if (!shouldReconnectRef.current) {
                    console.log('WebSocket disconnected intentionally, not reconnecting');
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            setIsConnected(false);
            isConnectingRef.current = false;
        }
    }, [conversationId]);

    const disconnect = useCallback(() => {
        console.log('Disconnecting WebSocket...');

        // Prevent auto-reconnect
        shouldReconnectRef.current = false;

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Reset reconnect attempts
        reconnectAttempts.current = maxReconnectAttempts;

        // Close WebSocket if open or connecting
        if (ws.current) {
            const state = ws.current.readyState;
            if (state === WebSocket.OPEN) {
                // Only close if fully open
                ws.current.close(1000, 'Client disconnect');
            } else if (state === WebSocket.CONNECTING) {
                // For connecting state, set a timeout to close after connection
                console.log('WebSocket is connecting, will close once connected');
                const wsToClose = ws.current;
                const closeTimer = setTimeout(() => {
                    if (wsToClose.readyState === WebSocket.OPEN) {
                        wsToClose.close(1000, 'Client disconnect');
                    }
                }, 100);

                // Also listen for when it opens and close immediately
                wsToClose.addEventListener('open', () => {
                    clearTimeout(closeTimer);
                    wsToClose.close(1000, 'Client disconnect');
                });
            }
            ws.current = null;
        }

        isConnectingRef.current = false;
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'chat_message',
                content,
            }));
        } else {
            console.error('WebSocket is not connected');
        }
    }, []);

    const sendTyping = useCallback((isTyping: boolean) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'typing_indicator',
                is_typing: isTyping,
            }));
        }
    }, []);

    const markAsRead = useCallback((messageIds: number[]) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'message_read',
                message_ids: messageIds,
            }));
        }
    }, []);

    const reconnect = useCallback(() => {
        console.log('Manual reconnect triggered');
        disconnect();
        reconnectAttempts.current = 0;
        shouldReconnectRef.current = true; // Re-enable auto-reconnect
        connect();
    }, [connect, disconnect]);

    useEffect(() => {
        // Only connect if enabled
        if (!enabled) {
            console.log('WebSocket disabled, skipping connection');
            return;
        }

        // Reset reconnect attempts when conversation changes
        reconnectAttempts.current = 0;
        connect();

        return () => {
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, enabled]); // Reconnect when conversation or enabled state changes

    return {
        sendMessage,
        sendTyping,
        markAsRead,
        isConnected,
        reconnect,
    };
}

