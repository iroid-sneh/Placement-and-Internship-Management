import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: "",
            trim: true,
        },
        url: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        _id: false,
    }
);

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderType: {
            type: String,
            enum: ["student", "company", "admin"],
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        attachments: {
            type: [attachmentSchema],
            default: [],
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, readBy: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
