import {
    createAnnouncement,
    createOrGetConversation,
    getConversationMessages,
    listAvailableChatContacts,
    listUserConversations,
    markConversationAsRead,
    sendChatMessage,
} from "../services/chat.service.js";

export const getConversations = async (req, res) => {
    try {
        const scope = req.query.scope === "all" ? "all" : "self";
        const conversations = await listUserConversations({
            ...req.user,
            scope,
        });

        return res.status(200).json({
            success: true,
            data: conversations,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch conversations",
        });
    }
};

export const getChatContacts = async (req, res) => {
    try {
        const contacts = await listAvailableChatContacts(req.user);
        return res.status(200).json({
            success: true,
            data: contacts,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch chat contacts",
        });
    }
};

export const startConversation = async (req, res) => {
    try {
        const { targetUserId, targetType } = req.body;
        const conversation = await createOrGetConversation({
            currentUser: req.user,
            targetUserId,
            targetType,
        });

        return res.status(200).json({
            success: true,
            data: conversation,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to start conversation",
        });
    }
};

export const getMessages = async (req, res) => {
    try {
        const messages = await getConversationMessages(req.user, req.params.conversationId);
        return res.status(200).json({
            success: true,
            data: messages,
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message || "Failed to fetch messages",
        });
    }
};

export const postMessage = async (req, res) => {
    try {
        const message = await sendChatMessage({
            currentUser: req.user,
            conversationId: req.params.conversationId,
            content: req.body.content,
            attachments: req.body.attachments,
        });

        return res.status(201).json({
            success: true,
            data: message,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to send message",
        });
    }
};

export const readConversation = async (req, res) => {
    try {
        const result = await markConversationAsRead(req.user, req.params.conversationId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to mark conversation as read",
        });
    }
};

export const sendAnnouncement = async (req, res) => {
    try {
        const result = await createAnnouncement({
            currentUser: req.user,
            title: req.body.title,
            message: req.body.message,
            targetRole: req.body.targetRole,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to send announcement",
        });
    }
};
