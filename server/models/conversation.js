import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        participantTypes: [
            {
                type: String,
                enum: ["student", "company", "admin"],
                required: true,
            },
        ],
        lastMessage: {
            content: {
                type: String,
                default: "",
                trim: true,
            },
            timestamp: {
                type: Date,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
