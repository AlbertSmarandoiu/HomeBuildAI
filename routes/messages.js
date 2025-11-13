import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
// Asigură-te că ai o funcție middleware pentru a verifica autentificarea (ex: verifyToken)
// import verifyToken from '../middleware/authMiddleware.js'; 

const router = express.Router();

// 1. RUTA: Creare conversație / Trimitere prim mesaj (dacă nu există chat)
router.post('/', async (req, res) => {
    try {
        const { receiverId, senderId, content } = req.body;
        
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

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

        const message = await Message.create({
            conversationId: conversation._id,
            senderId: senderId,
            content: content,
        });

        res.status(201).json({ conversation, message });

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
        .populate('participants', 'name companyName email'); // Asigură-te că User/Pro are câmpul 'name' sau 'companyName'

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Eroare la preluarea listei de conversații:", error);
        res.status(500).json({ message: "Eroare server" });
    }
});


// 3. RUTA: Preluarea mesajelor dintr-o conversație
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        })
        .sort({ createdAt: 1 }); // Ordine cronologică

        res.status(200).json(messages);
    } catch (error) {
        console.error("Eroare la preluarea mesajelor:", error);
        res.status(500).json({ message: "Eroare server" });
    }
});


export default router;