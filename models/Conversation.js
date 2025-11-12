import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    // Participanții, în general un User (client) și un Pro (constructor)
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referință la modelul User (care include și Pro-ul)
        required: true,
    }],
    lastMessage: {
        type: String,
        default: ""
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Poți adăuga și referința la lucrarea inițială (opțional, dar util)
    // requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InteriorRequest' } 
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);