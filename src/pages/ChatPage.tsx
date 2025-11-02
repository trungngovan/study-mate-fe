import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Input, Splitter, Tooltip } from 'antd'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'
import { useWebSocketChat, ChatMessage } from '@/hooks/useWebSocketChat'
import { Send } from 'lucide-react'

interface Conversation {
  id: number
  other_participant: { id: number; full_name: string; avatar_url?: string }
  last_message_preview?: { content: string; created_at: string }
  unread_count: number
}

export default function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [, setIsLoading] = useState(true)
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Ref for messages container to enable auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevSelectedConvRef = useRef<number | null>(null)

  // Get access token for WebSocket
  const accessToken = localStorage.getItem('access_token') || ''

  // Scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // WebSocket hook for real-time messaging - only active when conversation is selected
  const {
    isConnected,
    sendMessage: wsendMessage,
    disconnect: manualDisconnect,
  } = useWebSocketChat({
    conversationId: selectedConv?.id || 0,
    accessToken,
    onMessage: (message: ChatMessage) => {
      console.log('🔔 ChatPage received message, adding to state:', message)
      const newMessage = {
        id: message.message_id,
        sender_id: message.sender_id,
        sender_name: message.sender_name,
        content: message.content,
        created_at: message.created_at,
      }

      // Update messages
      setMessages((prev) => {
        console.log('📝 Current messages count:', prev.length, '→ New count:', prev.length + 1)
        return [...prev, newMessage]
      })

      // Update conversation list with latest message preview and timestamp
      if (selectedConv) {
        const conversationId = selectedConv.id

        setConversations((prevConvs) => {
          const updatedConvs = prevConvs.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                last_message_preview: {
                  content: message.content,
                  created_at: message.created_at,
                },
              }
            }
            return conv
          })

          // Sort by last message timestamp (most recent first)
          return updatedConvs.sort((a, b) => {
            const timeA = a.last_message_preview?.created_at
              ? new Date(a.last_message_preview.created_at).getTime()
              : 0
            const timeB = b.last_message_preview?.created_at
              ? new Date(b.last_message_preview.created_at).getTime()
              : 0
            return timeB - timeA
          })
        })

        // Update selected conversation state
        setSelectedConv((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            last_message_preview: {
              content: message.content,
              created_at: message.created_at,
            },
          }
        })
      }

      // Scroll to bottom when new message arrives
      setTimeout(() => scrollToBottom(), 100)
    },
    onTyping: (typing) => {
      console.log(`⌨️ ${typing.user_name} is ${typing.is_typing ? 'typing...' : 'stopped typing'}`)
    },
    onError: (error) => {
      console.error('❌ WebSocket error:', error)
    },
  })

  // Manage WebSocket connection based on selected conversation
  useEffect(() => {
    if (selectedConv && selectedConv.id > 0) {
      // Connection will be established by the hook's auto-connect
      console.log('Starting WebSocket for conversation:', selectedConv.id)
    } else {
      // Disconnect when no conversation is selected
      manualDisconnect()
    }
  }, [selectedConv, manualDisconnect])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/chat/conversations/')
        // API returns { results: [...] } format
        const convs = response.data.results || response.data || []
        setConversations(convs)

        // Auto-select conversation from URL param if provided
        const conversationId = searchParams.get('conversation')
        if (conversationId) {
          const conv = convs.find((c: Conversation) => c.id === parseInt(conversationId))
          if (conv) {
            setSelectedConv(conv)
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
        setConversations([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Fetch initial messages when conversation is selected
  useEffect(() => {
    const conversationId = selectedConv?.id
    if (conversationId) {
      console.log('📥 Fetching initial messages for conversation:', conversationId)
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/chat/conversations/${conversationId}/messages/`)
          // Format messages to match WebSocket format
          const formattedMessages = (response.data.results || []).map((msg: any) => ({
            id: msg.id,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            content: msg.content,
            created_at: msg.created_at,
          }))
          console.log('✅ Loaded', formattedMessages.length, 'messages from history')
          // Reverse to show oldest first (natural chat order)
          const reversedMessages = formattedMessages.reverse()
          setMessages(reversedMessages)
          setNextPageUrl(response.data.next || null)

          // Update conversation list with the latest message preview
          // Get the most recent message (last one in reversed array, which is the newest)
          if (reversedMessages.length > 0) {
            const latestMessage = reversedMessages[reversedMessages.length - 1]

            // Update conversation list with latest message preview
            setConversations((prevConvs) => {
              const updatedConvs = prevConvs.map((conv) => {
                if (conv.id === conversationId) {
                  return {
                    ...conv,
                    last_message_preview: {
                      content: latestMessage.content,
                      created_at: latestMessage.created_at,
                    },
                  }
                }
                return conv
              })

              // Sort by last message timestamp (most recent first)
              return updatedConvs.sort((a, b) => {
                const timeA = a.last_message_preview?.created_at
                  ? new Date(a.last_message_preview.created_at).getTime()
                  : 0
                const timeB = b.last_message_preview?.created_at
                  ? new Date(b.last_message_preview.created_at).getTime()
                  : 0
                return timeB - timeA
              })
            })
          }
        } catch (error) {
          console.error('❌ Failed to fetch messages:', error)
        }
      }

      fetchMessages()
    } else {
      console.log('🔄 No conversation selected, clearing messages')
      setMessages([])
      setNextPageUrl(null)
      prevSelectedConvRef.current = null
    }
  }, [selectedConv?.id])

  // Sync selectedConv with updated conversation from list
  useEffect(() => {
    if (selectedConv) {
      const updatedConv = conversations.find((c) => c.id === selectedConv.id)
      if (updatedConv) {
        // Only update if preview is actually different to avoid unnecessary re-renders
        const prevPreview = selectedConv.last_message_preview
        const newPreview = updatedConv.last_message_preview

        if (
          !prevPreview ||
          !newPreview ||
          prevPreview.content !== newPreview.content ||
          prevPreview.created_at !== newPreview.created_at
        ) {
          setSelectedConv(updatedConv)
        }
      }
    }
  }, [conversations])

  // Auto-scroll to bottom when messages are loaded for a new conversation
  useEffect(() => {
    if (selectedConv && messages.length > 0) {
      const isNewConversation = prevSelectedConvRef.current !== selectedConv.id
      if (isNewConversation) {
        prevSelectedConvRef.current = selectedConv.id
        // Scroll to bottom after messages are loaded
        setTimeout(() => scrollToBottom(), 200)
      }
    }
  }, [selectedConv, messages.length])

  // Load more (older) messages
  const loadMoreMessages = async () => {
    if (!nextPageUrl || isLoadingMore) return

    setIsLoadingMore(true)
    console.log('📥 Loading more messages from:', nextPageUrl)
    
    try {
      const response = await api.get(nextPageUrl)
      const formattedMessages = (response.data.results || []).map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        content: msg.content,
        created_at: msg.created_at,
      }))
      console.log('✅ Loaded', formattedMessages.length, 'more messages')
      
      // Reverse to maintain chronological order, then prepend older messages
      setMessages((prev) => [...formattedMessages.reverse(), ...prev])
      setNextPageUrl(response.data.next || null)
    } catch (error) {
      console.error('❌ Failed to load more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedConv) {
      console.log('⚠️ Cannot send: empty message or no conversation selected')
      return
    }

    // Check if WebSocket is connected before sending
    if (!isConnected) {
      console.error('❌ WebSocket not connected. Please wait for connection.')
      return
    }

    console.log('🚀 Attempting to send message:', messageText.trim())

    // Send message via WebSocket
    const success = wsendMessage(messageText.trim())
    if (success) {
      console.log('✅ Message sent successfully, clearing input')
      setMessageText('')
      // Message will be added via WebSocket onMessage callback, which will scroll
    } else {
      console.error('❌ Failed to send message via WebSocket')
    }
  }

  return (
    <div className="h-screen w-full">
      <Splitter
        style={{ height: '100%', width: '100%' }}
        layout="horizontal"
      >
        {/* Conversations list panel */}
        <Splitter.Panel
          defaultSize="30%"
          min="250px"
          max="40%"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <Input
              placeholder="Search conversations..."
              size="middle"
            />
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
            }}
          >
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor:
                    selectedConv?.id === conv.id ? '#1890ff' : '#fafafa',
                  color: selectedConv?.id === conv.id ? '#fff' : '#000',
                }}
                onMouseEnter={(e) => {
                  if (selectedConv?.id !== conv.id) {
                    e.currentTarget.style.backgroundColor = '#e6f7ff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConv?.id !== conv.id) {
                    e.currentTarget.style.backgroundColor = '#fafafa'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, flex: 1 }}>
                    {conv.other_participant.full_name}
                  </p>
                  {conv.last_message_preview?.created_at && (
                    <span
                      style={{
                        fontSize: '11px',
                        opacity: 0.6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {new Date(conv.last_message_preview.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    opacity: 0.7,
                    margin: '4px 0 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {conv.last_message_preview?.content || 'No messages yet'}
                </p>
              </div>
            ))}
          </div>
        </Splitter.Panel>

        {/* Chat area panel */}
        <Splitter.Panel
          defaultSize="70%"
          min="400px"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {selectedConv.other_participant.full_name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isConnected ? '#52c41a' : '#ff4d4f',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>

              {/* Messages area - scrollable */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {nextPageUrl && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Button
                      onClick={loadMoreMessages}
                      loading={isLoadingMore}
                      type="default"
                      size="small"
                    >
                      Load More Messages
                    </Button>
                  </div>
                )}
                {messages.map((msg) => {
                  const isCurrentUser = user && msg.sender_id === user.id
                  const timestamp = new Date(msg.created_at).toLocaleString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                        marginBottom: '2px',
                      }}
                    >
                      <Tooltip title={timestamp} placement={isCurrentUser ? 'left' : 'right'} mouseEnterDelay={0.5}>
                        <div
                          style={{
                            maxWidth: '300px',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            backgroundColor: isCurrentUser
                              ? '#1890ff'
                              : '#f0f0f0',
                            color: isCurrentUser ? '#fff' : '#000',
                            cursor: 'pointer',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: '14px' }}>{msg.content}</p>
                        </div>
                      </Tooltip>
                    </div>
                  )
                })}
                {/* Invisible element at the end for scroll target */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '16px',
                  borderTop: '1px solid #f0f0f0',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <Input
                  placeholder={isConnected ? 'Type your message...' : 'Connecting...'}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  size="large"
                  disabled={!isConnected}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Send className="h-4 w-4" />}
                  disabled={!isConnected}
                  size="large"
                />
              </form>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <p style={{ color: '#8c8c8c' }}>
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
    </div>
  )
}
