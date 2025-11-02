import { useState, useEffect, useCallback, useRef } from 'react'

export interface ChatMessage {
  message_id: number
  sender_id: number
  sender_name: string
  sender_avatar: string
  content: string
  created_at: string
}

export interface TypingIndicator {
  user_id: number
  user_name: string
  is_typing: boolean
}

export interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketChatOptions {
  conversationId: number
  accessToken: string
  onMessage?: (message: ChatMessage) => void
  onTyping?: (typing: TypingIndicator) => void
  onError?: (error: string) => void
}

export function useWebSocketChat(options: UseWebSocketChatOptions) {
  const {
    conversationId,
    accessToken,
    onMessage,
    onTyping,
    onError,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use refs for callbacks to avoid recreating connect function
  const onMessageRef = useRef(onMessage)
  const onTypingRef = useRef(onTyping)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage
    onTypingRef.current = onTyping
    onErrorRef.current = onError
  }, [onMessage, onTyping, onError])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isConnected || isConnecting) return

    setIsConnecting(true)

    try {
      // Get WebSocket base URL from environment
      const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

      // Build WebSocket URL with conversation ID and token
      const wsUrl = `${wsBaseUrl}/ws/chat/${conversationId}/?token=${accessToken}`

      console.log('Connecting to WebSocket:', wsUrl)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setIsConnecting(false)
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          console.log('📩 WebSocket received:', data)

          switch (data.type) {
            case 'connection_established':
              console.log('✅ Connection established:', data.message)
              break

            case 'chat_message':
              console.log('💬 New chat message:', {
                message_id: data.message_id,
                sender_id: data.sender_id,
                sender_name: data.sender_name,
                content: data.content,
              })
              onMessageRef.current?.({
                message_id: data.message_id,
                sender_id: data.sender_id,
                sender_name: data.sender_name,
                sender_avatar: data.sender_avatar,
                content: data.content,
                created_at: data.created_at,
              })
              break

            case 'typing_indicator':
              console.log('⌨️ Typing indicator:', data)
              onTypingRef.current?.({
                user_id: data.user_id,
                user_name: data.user_name,
                is_typing: data.is_typing,
              })
              break

            case 'messages_read':
              console.log('👁️ Messages marked as read:', data)
              break

            case 'error':
              const errorMsg = data.message || 'Unknown error'
              console.error('❌ WebSocket error:', errorMsg)
              onErrorRef.current?.(errorMsg)
              break

            default:
              console.warn('⚠️ Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error, event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        onErrorRef.current?.('Connection error')
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      onErrorRef.current?.('Failed to connect')
      setIsConnecting(false)
    }
  }, [conversationId, accessToken, isConnected, isConnecting])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  // Send message
  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket not connected, readyState:', wsRef.current?.readyState)
        return false
      }

      try {
        const messagePayload = {
          type: 'chat_message',
          content,
        }
        console.log('📤 Sending message:', messagePayload)
        wsRef.current.send(JSON.stringify(messagePayload))
        return true
      } catch (error) {
        console.error('❌ Failed to send message:', error)
        return false
      }
    },
    []
  )

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing_indicator',
          is_typing: isTyping,
        })
      )
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }, [])

  // Mark messages as read
  const markAsRead = useCallback((messageIds: number[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          type: 'message_read',
          message_ids: messageIds,
        })
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [])

  // Auto-connect on mount only if conversationId is valid
  useEffect(() => {
    // Only connect if conversationId is valid (> 0)
    if (conversationId > 0) {
      connect()
    }

    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, accessToken])

  return {
    isConnected,
    isConnecting,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    connect,
    disconnect,
  }
}
