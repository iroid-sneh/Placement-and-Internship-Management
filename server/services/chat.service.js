import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import Notification from "../models/notification.js";
import Application from "../models/application.js";
import Job from "../models/job.js";
import User from "../models/user.js";
import Company from "../models/company.js";
import {
    emitToConversation,
    emitToUser,
    isUserOnline,
    isUserViewingConversation,
} from "./socket.service.js";
import { createNotification, getUnreadCount } from "./notification.service.js";

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map();

function sanitizeText(value = "") {
    return String(value)
        .replace(/[<>]/g, "")
        .replace(/<\/?script[^>]*>/gi, "")
        .trim();
}

function sanitizeAttachments(attachments = []) {
    if (!Array.isArray(attachments)) return [];

    return attachments
        .slice(0, 5)
        .map((item) => ({
            name: sanitizeText(item?.name || ""),
            url: sanitizeText(item?.url || ""),
            type: sanitizeText(item?.type || ""),
        }))
        .filter((item) => item.url);
}

function ensureRateLimit(userId) {
    const now = Date.now();
    const key = String(userId);
    const timestamps = rateLimitMap.get(key) || [];
    const recent = timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_COUNT) {
        throw new Error("Rate limit exceeded. You can send up to 10 messages per minute.");
    }

    recent.push(now);
    rateLimitMap.set(key, recent);
}

async function getCompanyByUserId(userId) {
    return Company.findOne({ userId });
}

async function ensureParticipantExists(userId, role) {
    const user = await User.findById(userId).select("name email role isActive");
    if (!user || !user.isActive) {
        throw new Error("User is not available for chat");
    }
    if (role && user.role !== role) {
        throw new Error("Invalid chat target");
    }
    return user;
}

async function hasStudentCompanyApplication(studentId, companyUserId) {
    const company = await getCompanyByUserId(companyUserId);
    if (!company) return false;

    const jobIds = await Job.find({ companyId: company._id }).distinct("_id");
    if (jobIds.length === 0) return false;

    const application = await Application.findOne({
        studentId,
        jobId: { $in: jobIds },
    }).select("_id");

    return Boolean(application);
}

async function assertChatPermission(sender, receiver) {
    if (sender.role === "admin") {
        if (receiver.role === "admin") {
            throw new Error("Admins can chat only with students or companies");
        }
        return true;
    }

    if (sender.role === "student") {
        if (receiver.role !== "company") {
            throw new Error("Students can only chat with companies they applied to");
        }
        const allowed = await hasStudentCompanyApplication(sender.id, receiver._id);
        if (!allowed) {
            throw new Error("You can only message companies where you have applied");
        }
        return true;
    }

    if (sender.role === "company") {
        if (receiver.role !== "student") {
            throw new Error("Companies can only chat with student applicants");
        }
        const allowed = await hasStudentCompanyApplication(receiver._id, sender.id);
        if (!allowed) {
            throw new Error("You can only message students who applied to your jobs");
        }
        return true;
    }

    throw new Error("Unsupported chat role");
}

export async function verifyConversationAccess(user, conversationId) {
    const conversation = await Conversation.findById(conversationId).populate(
        "participants",
        "name email role"
    );

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    const isParticipant = conversation.participants.some(
        (participant) => String(participant._id) === String(user.id)
    );

    if (!isParticipant && user.role !== "admin") {
        throw new Error("You are not allowed to access this conversation");
    }

    return conversation;
}

async function findDirectConversation(userIdA, userIdB) {
    return Conversation.findOne({
        participants: {
            $all: [
                new mongoose.Types.ObjectId(String(userIdA)),
                new mongoose.Types.ObjectId(String(userIdB)),
            ],
        },
        $expr: { $eq: [{ $size: "$participants" }, 2] },
    }).populate("participants", "name email role");
}

async function formatConversationSummary(conversation, currentUserId) {
    const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        sender: { $ne: currentUserId },
        readBy: { $nin: [currentUserId] },
    });

    const otherParticipants = conversation.participants.filter(
        (participant) => String(participant._id) !== String(currentUserId)
    );

    return {
        _id: conversation._id,
        participants: conversation.participants.map((participant) => ({
            _id: participant._id,
            name: participant.name,
            email: participant.email,
            role: participant.role,
        })),
        participantTypes: conversation.participantTypes,
        counterpart: otherParticipants[0]
            ? {
                  _id: otherParticipants[0]._id,
                  name: otherParticipants[0].name,
                  email: otherParticipants[0].email,
                  role: otherParticipants[0].role,
              }
            : null,
        lastMessage: conversation.lastMessage,
        unreadCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
}

async function formatMessage(message) {
    const populated = await Message.findById(message._id).populate(
        "sender",
        "name email role"
    );

    return {
        _id: populated._id,
        conversationId: populated.conversationId,
        sender: {
            _id: populated.sender._id,
            name: populated.sender.name,
            email: populated.sender.email,
            role: populated.sender.role,
        },
        senderType: populated.senderType,
        content: populated.content,
        attachments: populated.attachments,
        readBy: populated.readBy.map((userId) => String(userId)),
        createdAt: populated.createdAt,
    };
}

export async function createOrGetConversation({ currentUser, targetUserId, targetType }) {
    const receiver = await ensureParticipantExists(targetUserId, targetType);
    await assertChatPermission(currentUser, receiver);

    const existingConversation = await findDirectConversation(currentUser.id, targetUserId);
    if (existingConversation) {
        return formatConversationSummary(existingConversation, currentUser.id);
    }

    const conversation = await Conversation.create({
        participants: [currentUser.id, targetUserId],
        participantTypes: [currentUser.role, receiver.role],
        lastMessage: {
            content: "",
            timestamp: null,
        },
    });

    const populatedConversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "name email role"
    );

    return formatConversationSummary(populatedConversation, currentUser.id);
}

export async function listUserConversations(currentUser) {
    const query =
        currentUser.role === "admin" && currentUser.scope === "all"
            ? {}
            : { participants: currentUser.id };

    const conversations = await Conversation.find(query)
        .populate("participants", "name email role")
        .sort({ updatedAt: -1 });

    return Promise.all(
        conversations.map((conversation) =>
            formatConversationSummary(conversation, currentUser.id)
        )
    );
}

export async function listAvailableChatContacts(currentUser) {
    if (currentUser.role === "student") {
        const applications = await Application.find({ studentId: currentUser.id })
            .populate({
                path: "jobId",
                populate: {
                    path: "companyId",
                    model: "Company",
                },
            })
            .sort({ createdAt: -1 });

        const uniqueContacts = new Map();
        for (const application of applications) {
            const company = application.jobId?.companyId;
            if (!company?.userId || uniqueContacts.has(String(company.userId))) continue;
            uniqueContacts.set(String(company.userId), {
                userId: String(company.userId),
                role: "company",
                name: company.name,
                subtitle: company.industry || company.email,
            });
        }
        return Array.from(uniqueContacts.values());
    }

    if (currentUser.role === "company") {
        const company = await getCompanyByUserId(currentUser.id);
        if (!company) return [];

        const jobIds = await Job.find({ companyId: company._id }).distinct("_id");
        const applications = await Application.find({ jobId: { $in: jobIds } })
            .populate("studentId", "name email role")
            .sort({ createdAt: -1 });

        const uniqueContacts = new Map();
        for (const application of applications) {
            const student = application.studentId;
            if (!student?._id || uniqueContacts.has(String(student._id))) continue;
            uniqueContacts.set(String(student._id), {
                userId: String(student._id),
                role: "student",
                name: student.name,
                subtitle: student.email,
            });
        }
        return Array.from(uniqueContacts.values());
    }

    const users = await User.find({
        role: { $in: ["student", "company"] },
        isActive: true,
    })
        .select("name email role")
        .sort({ createdAt: -1 });

    return users.map((user) => ({
        userId: String(user._id),
        role: user.role,
        name: user.name,
        subtitle: user.email,
    }));
}

export async function getConversationMessages(currentUser, conversationId) {
    await verifyConversationAccess(currentUser, conversationId);

    const messages = await Message.find({ conversationId })
        .populate("sender", "name email role")
        .sort({ createdAt: 1 })
        .lean();

    return messages.map((message) => ({
        _id: message._id,
        conversationId: message.conversationId,
        sender: message.sender,
        senderType: message.senderType,
        content: message.content,
        attachments: message.attachments,
        readBy: (message.readBy || []).map((userId) => String(userId)),
        createdAt: message.createdAt,
    }));
}

export async function markConversationAsRead(currentUser, conversationId) {
    await verifyConversationAccess(currentUser, conversationId);

    await Message.updateMany(
        {
            conversationId,
            sender: { $ne: currentUser.id },
            readBy: { $nin: [currentUser.id] },
        },
        { $addToSet: { readBy: currentUser.id } }
    );

    await Notification.updateMany(
        {
            userId: currentUser.id,
            conversationId,
            type: "message",
            isRead: false,
        },
        { $set: { isRead: true } }
    );

    emitToConversation(conversationId, "messageRead", {
        conversationId,
        userId: currentUser.id,
    });

    const unreadCount = await getUnreadCount(currentUser.id);
    emitToUser(currentUser.id, "notificationUnreadCount", { unreadCount });

    return { conversationId, userId: currentUser.id };
}

export async function sendChatMessage({
    currentUser,
    conversationId,
    content,
    attachments = [],
}) {
    ensureRateLimit(currentUser.id);

    const sanitizedContent = sanitizeText(content);
    const sanitizedAttachments = sanitizeAttachments(attachments);

    if (!sanitizedContent && sanitizedAttachments.length === 0) {
        throw new Error("Message content is required");
    }

    if (sanitizedContent.length > MAX_MESSAGE_LENGTH) {
        throw new Error("Message cannot exceed 2000 characters");
    }

    const conversation = await verifyConversationAccess(currentUser, conversationId);
    const isParticipant = conversation.participants.some(
        (participant) => String(participant._id) === String(currentUser.id)
    );
    if (!isParticipant && currentUser.role !== "admin") {
        throw new Error("Only conversation participants can send messages");
    }

    const message = await Message.create({
        conversationId,
        sender: currentUser.id,
        senderType: currentUser.role,
        content: sanitizedContent,
        attachments: sanitizedAttachments,
        readBy: [currentUser.id],
    });

    await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
            lastMessage: {
                content: sanitizedContent || "Attachment",
                timestamp: message.createdAt,
            },
        },
    });

    const formattedMessage = await formatMessage(message);
    const recipients = conversation.participants.filter(
        (participant) => String(participant._id) !== String(currentUser.id)
    );

    emitToConversation(conversationId, "receiveMessage", formattedMessage);
    emitToConversation(conversationId, "conversationUpdated", {
        conversationId,
        lastMessage: {
            content: sanitizedContent || "Attachment",
            timestamp: message.createdAt,
        },
    });

    for (const recipient of recipients) {
        const recipientId = String(recipient._id);
        const shouldCreateNotification =
            !isUserOnline(recipientId) ||
            !isUserViewingConversation(recipientId, conversationId);

        if (shouldCreateNotification) {
            const notification = await createNotification({
                userId: recipientId,
                type: "message",
                title: "New message",
                message: `New message from ${currentUser.name}`,
                link: `chat/${conversationId}`,
                conversationId,
            });

            if (notification) {
                emitToUser(recipientId, "notificationCreated", notification);
            }
        }

        if (isUserOnline(recipientId) && !isUserViewingConversation(recipientId, conversationId)) {
            emitToUser(recipientId, "receiveMessage", formattedMessage);
        }

        const unreadCount = await getUnreadCount(recipientId);
        emitToUser(recipientId, "notificationUnreadCount", { unreadCount });
    }

    return formattedMessage;
}

export async function emitTypingStatus({ currentUser, conversationId, eventName }) {
    await verifyConversationAccess(currentUser, conversationId);
    emitToConversation(conversationId, eventName, {
        conversationId,
        userId: currentUser.id,
        name: currentUser.name,
    });
}

export async function createAnnouncement({ currentUser, title, message, targetRole }) {
    if (currentUser.role !== "admin") {
        throw new Error("Only admins can send announcements");
    }

    const cleanTitle = sanitizeText(title || "Announcement");
    const cleanMessage = sanitizeText(message);
    if (!cleanMessage) {
        throw new Error("Announcement message is required");
    }

    const roles =
        targetRole && targetRole !== "all"
            ? [targetRole]
            : ["student", "company"];

    const users = await User.find({
        role: { $in: roles },
        isActive: true,
    }).select("_id");

    const notifications = [];
    for (const user of users) {
        const notification = await createNotification({
            userId: user._id,
            type: "system",
            title: cleanTitle,
            message: cleanMessage,
            link: "dashboard",
        });
        if (notification) {
            notifications.push(notification);
            emitToUser(String(user._id), "notificationCreated", notification);
            const unreadCount = await getUnreadCount(user._id);
            emitToUser(String(user._id), "notificationUnreadCount", { unreadCount });
        }
    }

    return {
        sent: notifications.length,
        title: cleanTitle,
    };
}
