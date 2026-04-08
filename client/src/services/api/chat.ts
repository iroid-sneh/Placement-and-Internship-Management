import { apiRequest } from "./client";
import type {
  ChatContact,
  ChatMessage,
  ConversationSummary
} from "../../types/app";

export const getChatContacts = async (): Promise<ChatContact[]> => {
  const response = await apiRequest<ChatContact[]>("/chat/contacts");
  return response.data;
};

export const getConversations = async (
  scope: "self" | "all" = "self"
): Promise<ConversationSummary[]> => {
  const response = await apiRequest<ConversationSummary[]>(
    `/chat/conversations${scope === "all" ? "?scope=all" : ""}`
  );
  return response.data;
};

export const startConversation = async (
  targetUserId: string,
  targetType: "student" | "company" | "admin"
): Promise<ConversationSummary> => {
  const response = await apiRequest<ConversationSummary>("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ targetUserId, targetType })
  });
  return response.data;
};

export const getConversationMessages = async (
  conversationId: string
): Promise<ChatMessage[]> => {
  const response = await apiRequest<ChatMessage[]>(
    `/chat/conversations/${conversationId}/messages`
  );
  return response.data;
};

export const sendConversationMessage = async (
  conversationId: string,
  content: string,
  attachments: ChatMessage["attachments"] = []
): Promise<ChatMessage> => {
  const response = await apiRequest<ChatMessage>(
    `/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content, attachments })
    }
  );
  return response.data;
};

export const markConversationRead = async (conversationId: string): Promise<void> => {
  await apiRequest(`/chat/conversations/${conversationId}/read`, {
    method: "PUT"
  });
};

export const sendAnnouncement = async (
  title: string,
  message: string,
  targetRole: "student" | "company" | "all"
): Promise<{ sent: number; title: string }> => {
  const response = await apiRequest<{ sent: number; title: string }>(
    "/chat/announcements",
    {
      method: "POST",
      body: JSON.stringify({ title, message, targetRole })
    }
  );
  return response.data;
};
