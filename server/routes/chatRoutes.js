import express from "express";
import {
    getChatContacts,
    getConversations,
    getMessages,
    postMessage,
    readConversation,
    sendAnnouncement,
    startConversation,
} from "../controllers/chatController.js";
import { authorizeRoles, verifyJWT } from "../middleware/auth.js";

const chatRoutes = express.Router();

chatRoutes.use(verifyJWT, authorizeRoles("student", "company", "admin"));

chatRoutes.get("/contacts", getChatContacts);
chatRoutes.get("/conversations", getConversations);
chatRoutes.post("/conversations", startConversation);
chatRoutes.get("/conversations/:conversationId/messages", getMessages);
chatRoutes.post("/conversations/:conversationId/messages", postMessage);
chatRoutes.put("/conversations/:conversationId/read", readConversation);
chatRoutes.post("/announcements", authorizeRoles("admin"), sendAnnouncement);

export default chatRoutes;
