import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const router = express.Router();

// 1. RUTA: Creare conversație / Trimitere prim mesaj (dacă nu există chat)
router.post('/', async (req, res) => {
    try {
        const { receiverId, senderId, content } = req.body;
        
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        let message = null; // 🚨 Declari variabila la început
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                lastMessage: content,
            });
        } else {
            conversation.lastMessage = content;
            conversation.lastMessageAt = Date.now();
            await conversation.save();
        }

        if (content && content.trim().length > 0) {
                message = await Message.create({
                conversationId: conversation._id,
                senderId: senderId,
                content: content,
            });
        }

        // Returnează ID-ul conversației, indiferent dacă s-a trimis mesaj sau nu
        res.status(201).json({ 
            conversation: { _id: conversation._id }, 
            message:message 
        });

    } catch (error) {
        console.error("Eroare la trimiterea mesajului:", error);
        res.status(500).json({ message: "Eroare server la trimiterea mesajului" });
    }
});


// 2. RUTA: Preluarea listei de conversații
router.get('/conversations/:userId', async (req, res) => {
    try {
        const userId = req.params.userId; // User-ul sau Pro-ul logat
        
        // Găsește toate conversațiile în care este participant
        const conversations = await Conversation.find({
            participants: { $in: [userId] }
        })
        .sort({ lastMessageAt: -1 })
        // Populatează informațiile despre celălalt participant
        .populate('participants', 'companyName'); // Asigură-te că User/Pro are câmpul 'name' sau 'companyName'

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Eroare la preluarea listei de conversații:", error);
        res.status(500).json({ message: "Eroare server" });
    }
});
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const conversationId = req.params.conversationId;

        // 1. Găsește mesajele
        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

        // 2. Găsește participanții (din conversație)
        const conversation = await Conversation.findById(conversationId).select('participants');

        if (!conversation) {
             return res.status(404).json({ message: "Conversația nu a fost găsită." });
        }

        // ✅ Returnează ambele
        res.status(200).json({ messages, participants: conversation.participants }); 
    } catch (error) {
        // ... (Logica de eroare)
    }
});
export default router;