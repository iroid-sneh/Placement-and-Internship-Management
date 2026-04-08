import { Server } from "socket.io";
import AuthHelper from "../src/common/authHelper.js";

let ioInstance = null;
const onlineUsers = new Map();
const socketUsers = new Map();
const socketConversations = new Map();

function getTokenFromHandshake(socket) {
    const authToken = socket.handshake?.auth?.token;
    if (authToken) return authToken;

    const authHeader = socket.handshake?.headers?.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }

    return null;
}

function addSocketForUser(userId, socketId) {
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socketId);
    socketUsers.set(socketId, userId);
}

function removeSocket(socketId) {
    const userId = socketUsers.get(socketId);
    socketUsers.delete(socketId);
    socketConversations.delete(socketId);

    if (!userId) return;

    const sockets = onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size === 0) {
        onlineUsers.delete(userId);
    }
}

export function getIO() {
    return ioInstance;
}

export function getOnlineUsers() {
    return Object.fromEntries(
        Array.from(onlineUsers.entries()).map(([userId, socketIds]) => [
            userId,
            Array.from(socketIds),
        ])
    );
}

export function getSocketIdsForUser(userId) {
    return Array.from(onlineUsers.get(String(userId)) || []);
}

export function isUserOnline(userId) {
    return getSocketIdsForUser(userId).length > 0;
}

export function setActiveConversation(socketId, conversationId) {
    if (!conversationId) {
        socketConversations.delete(socketId);
        return;
    }
    socketConversations.set(socketId, String(conversationId));
}

export function isUserViewingConversation(userId, conversationId) {
    const socketIds = getSocketIdsForUser(userId);
    return socketIds.some(
        (socketId) => socketConversations.get(socketId) === String(conversationId)
    );
}

export function emitToUser(userId, eventName, payload) {
    if (!ioInstance) return;
    ioInstance.to(`user:${userId}`).emit(eventName, payload);
}

export function emitToConversation(conversationId, eventName, payload) {
    if (!ioInstance) return;
    ioInstance.to(`conversation:${conversationId}`).emit(eventName, payload);
}

export function initializeSocketServer(httpServer) {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    ioInstance.use((socket, next) => {
        try {
            const token = getTokenFromHandshake(socket);
            if (!token) {
                return next(new Error("Authentication token missing"));
            }
            const decoded = AuthHelper.verifyToken(token);
            socket.data.user = decoded;
            return next();
        } catch (error) {
            return next(new Error("Invalid or expired token"));
        }
    });

    return ioInstance;
}

export function registerSocketHandlers({
    onJoinConversation,
    onSendMessage,
    onTyping,
    onStopTyping,
    onMessageRead,
}) {
    if (!ioInstance) {
        throw new Error("Socket.IO server not initialized");
    }

    ioInstance.on("connection", (socket) => {
        const userId = String(socket.data.user.id);
        addSocketForUser(userId, socket.id);
        socket.join(`user:${userId}`);

        socket.emit("onlineUsers", getOnlineUsers());

        socket.on("joinConversation", async (payload = {}, callback = () => {}) => {
            try {
                const conversation = await onJoinConversation(socket, payload);
                callback({ ok: true, data: conversation });
            } catch (error) {
                callback({ ok: false, message: error.message || "Failed to join conversation" });
            }
        });

        socket.on("sendMessage", async (payload = {}, callback = () => {}) => {
            try {
                const message = await onSendMessage(socket, payload);
                callback({ ok: true, data: message });
            } catch (error) {
                callback({ ok: false, message: error.message || "Failed to send message" });
            }
        });

        socket.on("typing", async (payload = {}) => {
            try {
                await onTyping(socket, payload);
            } catch {
                // Ignore typing failures to keep the socket responsive.
            }
        });

        socket.on("stopTyping", async (payload = {}) => {
            try {
                await onStopTyping(socket, payload);
            } catch {
                // Ignore typing failures to keep the socket responsive.
            }
        });

        socket.on("messageRead", async (payload = {}, callback = () => {}) => {
            try {
                const data = await onMessageRead(socket, payload);
                callback({ ok: true, data });
            } catch (error) {
                callback({ ok: false, message: error.message || "Failed to mark messages as read" });
            }
        });

        socket.on("disconnect", () => {
            removeSocket(socket.id);
        });
    });

    return ioInstance;
}
