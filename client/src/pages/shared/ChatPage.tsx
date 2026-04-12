import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Paperclip,
  Send
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import {
  getChatContacts,
  getConversationMessages,
  getConversations,
  markConversationRead,
  sendAnnouncement,
  startConversation
} from "../../services/api/chat";
import { getChatSocket } from "../../services/chatSocket";
import type {
  ChatContact,
  ChatMessage,
  ConversationSummary,
  UserRole
} from "../../types/app";

interface ChatPageProps {
  userRole: UserRole;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  initialConversationId?: string;
}

function timeLabel(value?: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateLabel(value?: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

export function ChatPage({
  userRole,
  onNavigate,
  onLogout,
  initialConversationId
}: ChatPageProps) {
  const { user, token } = useAuth();
  const socketRef = useRef<ReturnType<typeof getChatSocket> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId || "");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("System Announcement");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<"student" | "company" | "all">("all");
  const [announcementStatus, setAnnouncementStatus] = useState("");
  const isAdminOnlyView = userRole === "admin";

  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      try {
        if (isAdminOnlyView) {
          const conversationData = await getConversations("all");
          setConversations(conversationData);
          setContacts([]);
          setSelectedConversationId("");
          return;
        }

        const [conversationData, contactData] = await Promise.all([
          getConversations("self"),
          getChatContacts()
        ]);

        setConversations(conversationData);
        setContacts(contactData);

        const targetConversationId =
          initialConversationId ||
          conversationData[0]?._id ||
          "";
        setSelectedConversationId(targetConversationId);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load chat");
      }
    };

    void loadInitialData();
  }, [initialConversationId, isAdminOnlyView]);

  useEffect(() => {
    if (!token) return;

    const socket = getChatSocket(token);
    socketRef.current = socket;

    const handleReceiveMessage = (message: ChatMessage) => {
      setConversations((prev) => {
        const next = prev.map((conversation) => {
          if (conversation._id !== message.conversationId) return conversation;
          const isCurrent = selectedConversationId === message.conversationId;
          return {
            ...conversation,
            lastMessage: {
              content: message.content || "Attachment",
              timestamp: message.createdAt
            },
            unreadCount:
              message.sender._id === user?.id || isCurrent
                ? conversation.unreadCount
                : conversation.unreadCount + 1,
            updatedAt: message.createdAt
          };
        });
        return [...next].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      if (message.conversationId === selectedConversationId) {
        setMessages((prev) =>
          prev.some((entry) => entry._id === message._id) ? prev : [...prev, message]
        );
      }
    };

    const handleTyping = (payload: { conversationId: string; userId: string; name: string }) => {
      if (
        payload.conversationId !== selectedConversationId ||
        payload.userId === user?.id
      ) {
        return;
      }
      setTypingUsers((prev) =>
        prev.includes(payload.name) ? prev : [...prev, payload.name]
      );
    };

    const handleStopTyping = (payload: {
      conversationId: string;
      userId: string;
      name: string;
    }) => {
      if (payload.conversationId !== selectedConversationId) return;
      setTypingUsers((prev) => prev.filter((name) => name !== payload.name));
    };

    const handleMessageRead = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== selectedConversationId) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.sender._id === payload.userId || message.readBy.includes(payload.userId)
            ? message
            : { ...message, readBy: [...message.readBy, payload.userId] }
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageRead", handleMessageRead);
    socket.on("notificationCreated", () => {
      void getConversations("self").then(setConversations).catch(() => undefined);
    });

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageRead", handleMessageRead);
      socket.off("notificationCreated");
    };
  }, [selectedConversationId, token, user?.id, userRole]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const loadConversation = async (): Promise<void> => {
      setLoadingMessages(true);
      setTypingUsers([]);
      try {
        const conversationMessages = await getConversationMessages(selectedConversationId);
        setMessages(conversationMessages);
        await markConversationRead(selectedConversationId);
        socketRef.current?.emit(
          "joinConversation",
          { conversationId: selectedConversationId },
          () => undefined
        );
        socketRef.current?.emit(
          "messageRead",
          { conversationId: selectedConversationId },
          () => undefined
        );
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === selectedConversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load conversation"
        );
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadConversation();
  }, [isAdminOnlyView, selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const selectedConversation =
    conversations.find((conversation) => conversation._id === selectedConversationId) || null;

  const handlePickConversation = (conversationId: string): void => {
    setSelectedConversationId(conversationId);
    onNavigate(`chat/${conversationId}`);
  };

  const handleStartConversation = async (): Promise<void> => {
    if (!selectedContactId) return;

    const contact = contacts.find((entry) => entry.userId === selectedContactId);
    if (!contact) return;

    try {
      const conversation = await startConversation(
        contact.userId,
        contact.role as "student" | "company" | "admin"
      );
      setConversations((prev) => {
        const filtered = prev.filter((entry) => entry._id !== conversation._id);
        return [conversation, ...filtered];
      });
      setSelectedConversationId(conversation._id);
      onNavigate(`chat/${conversation._id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start conversation"
      );
    }
  };

  const handleDraftChange = (value: string): void => {
    setDraft(value);

    if (!selectedConversationId || !socketRef.current) return;

    socketRef.current.emit("typing", { conversationId: selectedConversationId });
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit("stopTyping", {
        conversationId: selectedConversationId
      });
    }, 1200);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!selectedConversationId || !draft.trim()) {
      return;
    }

    setSendingMessage(true);
    setErrorMessage("");

    const payload = {
      conversationId: selectedConversationId,
      content: draft
    };

    try {
      const socket = socketRef.current;
      const message = await new Promise<ChatMessage>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Chat connection is unavailable"));
          return;
        }

        socket.emit("sendMessage", payload, (response: { ok: boolean; data?: ChatMessage; message?: string }) => {
          if (!response.ok || !response.data) {
            reject(new Error(response.message || "Failed to send message"));
            return;
          }
          resolve(response.data);
        });
      });

      setMessages((prev) =>
        prev.some((entry) => entry._id === message._id) ? prev : [...prev, message]
      );
      setConversations((prev) =>
        [{ ...(selectedConversation || {
          _id: selectedConversationId,
          participants: [],
          participantTypes: [],
          counterpart: null,
          lastMessage: { content: "", timestamp: null },
          unreadCount: 0,
          createdAt: message.createdAt,
          updatedAt: message.createdAt
        }),
        lastMessage: { content: message.content || "Attachment", timestamp: message.createdAt },
        updatedAt: message.createdAt }, ...prev.filter((entry) => entry._id !== selectedConversationId)]
      );
      setDraft("");
      socket?.emit("stopTyping", { conversationId: selectedConversationId });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAnnouncement = async (): Promise<void> => {
    try {
      const result = await sendAnnouncement(
        announcementTitle,
        announcementMessage,
        announcementTarget
      );
      setAnnouncementStatus(`Announcement delivered to ${result.sent} users.`);
      setAnnouncementMessage("");
    } catch (error) {
      setAnnouncementStatus(
        error instanceof Error ? error.message : "Failed to send announcement"
      );
    }
  };

  const chatBreadcrumbs = isAdminOnlyView
    ? [{ label: "Messages" }]
    : [
        { label: "Messages", href: "chat" },
        ...(selectedConversation?.counterpart
          ? [{ label: selectedConversation.counterpart.name }]
          : [])
      ];

  // Admin only sees Quick Announcement — no thread panel, no Messages heading
  if (isAdminOnlyView) {
    return (
      <DashboardLayout
        userRole={userRole}
        currentPath="chat"
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={{ name: user?.name || "User", email: user?.email || "" }}
        breadcrumbs={[{ label: "Quick Announcement" }]}
      >
        <div className="chat-admin-announcement-page">
          <div className="chat-admin-announcement-page__header">
            <h1 className="chat-admin-announcement-page__title">Quick Announcement</h1>
            <p className="chat-admin-announcement-page__subtitle">
              Broadcast a notification message to students, companies, or all platform users instantly.
            </p>
          </div>

          {errorMessage && (
            <div className="chat-admin-announcement-page__error">{errorMessage}</div>
          )}

          <div className="chat-admin-announcement-page__card">
            <div className="chat-admin-announcement-page__field">
              <label className="chat-admin-announcement-page__label">Announcement Title</label>
              <Input
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                placeholder="e.g. Campus Drive Update"
              />
            </div>

            <div className="chat-admin-announcement-page__field">
              <label className="chat-admin-announcement-page__label">Target Audience</label>
              <select
                value={announcementTarget}
                onChange={(event) =>
                  setAnnouncementTarget(event.target.value as "student" | "company" | "all")
                }
                className="chat-admin-announcement-page__select"
              >
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="company">Companies Only</option>
              </select>
            </div>

            <div className="chat-admin-announcement-page__field">
              <label className="chat-admin-announcement-page__label">Message</label>
              <textarea
                value={announcementMessage}
                onChange={(event) => setAnnouncementMessage(event.target.value)}
                rows={5}
                placeholder="Write the announcement message here..."
                className="chat-admin-announcement-page__textarea"
              />
            </div>

            <div className="chat-admin-announcement-page__actions">
              <Button onClick={() => void handleAnnouncement()}>
                Send Announcement
              </Button>
            </div>

            {announcementStatus && (
              <p className="chat-admin-announcement-page__status">{announcementStatus}</p>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole={userRole}
      currentPath={selectedConversationId ? `chat/${selectedConversationId}` : "chat"}
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || "User",
        email: user?.email || ""
      }}
      breadcrumbs={chatBreadcrumbs}
    >
      <div className="chat-page">
        <div className="chat-workspace">
          <section className="chat-panel chat-panel--conversation">
            <div className="chat-panel__header">
              <div className="chat-panel__title-row">
                <MessageSquare className="chat-icon" />
                <h1 className="chat-panel__title">
                  Messages
                </h1>
              </div>
              <p className="chat-panel__subtitle">
                Continue existing chats or start a new conversation.
              </p>
            </div>

            <div className="chat-panel__body chat-panel__body--conversation">
              <div className="chat-start-row">
                <select
                  value={selectedContactId}
                  onChange={(event) => setSelectedContactId(event.target.value)}
                  className="chat-start-row__select chat-start-row__select--light"
                >
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.userId} value={contact.userId}>
                      {contact.name} ({contact.role})
                    </option>
                  ))}
                </select>
                <Button onClick={() => void handleStartConversation()} size="sm" className="!h-10">
                  Open
                </Button>
              </div>

              <div className="chat-conversation-list">
                {conversations.length === 0 && (
                  <div className="chat-empty">
                    No conversations yet.
                  </div>
                )}

                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => handlePickConversation(conversation._id)}
                    className={`chat-conversation-card ${
                      selectedConversationId === conversation._id
                        ? "chat-conversation-card--active"
                        : ""
                    }`}
                  >
                    <div className="chat-conversation-card__top">
                      <div className="min-w-0">
                        <p className="chat-conversation-card__title">
                          {conversation.counterpart?.name || "Conversation"}
                        </p>
                        <p className="chat-conversation-card__meta">
                          {conversation.counterpart?.role || "conversation"}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="chat-unread-badge">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="chat-conversation-card__preview">
                      {conversation.lastMessage.content || "No messages yet"}
                    </p>
                    <p className="chat-conversation-card__time">
                      {dateLabel(conversation.lastMessage.timestamp)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="chat-panel chat-panel--thread">
            <div className="chat-panel__header">
              <div className="chat-panel__title-row">
                <h2 className="chat-panel__title">
                  {selectedConversation?.counterpart?.name || "Select a thread"}
                </h2>
              </div>
              <p className="chat-panel__subtitle">
                {selectedConversation?.counterpart?.email || "Real-time Socket.IO chat"}
              </p>
            </div>

            {errorMessage && (
              <div className="chat-panel__error">
                {errorMessage}
              </div>
            )}

            <div className="chat-panel__body chat-panel__body--thread">
              <div className="chat-thread">
                <div className="chat-thread__messages">
                  {loadingMessages && (
                    <div className="chat-panel__subtitle">Loading conversation...</div>
                  )}

                  {!loadingMessages && selectedConversationId === "" && (
                    <div className="chat-empty chat-empty--center">
                      Choose a conversation to start chatting.
                    </div>
                  )}

                  {messages.map((message) => {
                    const isOwnMessage = message.sender._id === user?.id;
                    const isReadByOther = message.readBy.some((readerId) => readerId !== user?.id);

                    return (
                      <div
                        key={message._id}
                        className={`chat-message-row ${
                          isOwnMessage ? "chat-message-row--own" : "chat-message-row--other"
                        }`}
                      >
                        <div
                          className={`chat-message-bubble ${
                            isOwnMessage
                              ? "chat-message-bubble--own"
                              : "chat-message-bubble--other"
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="chat-message-bubble__sender">
                              {message.sender.name}
                            </p>
                          )}
                          {message.content && (
                            <p className="chat-message-bubble__content">{message.content}</p>
                          )}
                          {message.attachments.length > 0 && (
                            <div className="chat-message-bubble__attachments">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={`${message._id}-${attachment.url}`}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="chat-message-bubble__attachment"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  <span>{attachment.name || attachment.url}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="chat-message-bubble__meta">
                            <span>{timeLabel(message.createdAt)}</span>
                            {isOwnMessage && <span>{isReadByOther ? "Seen" : "Sent"}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {typingUsers.length > 0 && (
                    <div className="chat-typing">
                      {typingUsers.join(", ")} typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-composer">
                  <div className="chat-composer__row">
                    <div className="chat-composer__input-container">
                      <textarea
                        value={draft}
                        onChange={(event) => handleDraftChange(event.target.value)}
                        rows={2}
                        maxLength={2000}
                        placeholder="Type your message..."
                        className="chat-composer__input chat-composer__input--light"
                      />
                    </div>
                    <div className="chat-composer__button">
                      <Button
                        onClick={() => void handleSendMessage()}
                        isLoading={sendingMessage}
                        disabled={!selectedConversationId}
                        icon={<Send className="h-4 w-4" />}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
