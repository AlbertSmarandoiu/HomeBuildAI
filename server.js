import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import messagesRoutes from './routes/messages.js';
import User from "./models/user.js";
import proRoutes from "./routes/proRoutes.js";
import interiorRoute from "./routes/interior.js";
import jwt from 'jsonwebtoken';
import portfolioRoutes from './routes/portfolio.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/messages", messagesRoutes);
app.use("/api/portfolio", portfolioRoutes);
// 🔗 Conectare la MongoDB

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://10.0.2.2:8081", // Sau adresa ta Expo/Emulator
        methods: ["GET", "POST"]
    }
});
// 🚨 2. LOGICA SOCKET.IO
io.on('connection', (socket) => {
    console.log(`Un utilizator s-a conectat: ${socket.id}`);
    
    // 🔔 Se presupune că utilizatorul trimite ID-ul său (User sau Pro) la conectare
    // De exemplu, când clientul se conectează: socket.emit('join', user_id)
    socket.on('join', (userId) => {
        // Creează o "cameră" unică pentru fiecare utilizator
        socket.join(userId); 
        console.log(`Utilizatorul ${userId} s-a alăturat camerei.`);
    });

    // 📩 Trimiterea unui mesaj
    socket.on('sendMessage', async (messageData) => {
        // messageData ar trebui să conțină: { senderId, receiverId, content, conversationId }
        
        // 1. Salvarea mesajului în baza de date (Folosește logica din routes/messages.js sau mută logica aici)
        // 🚨 Pentru simplificare, vom emite direct către receptor și vom presupune că salvarea în DB se face separat (ideal ar trebui să se salveze aici!)

        // 2. Emiterea către receptor (către camera receptorului)
        io.to(messageData.receiverId).emit('message', messageData);
        io.to(messageData.senderId).emit('message', messageData); // Trimite și către expeditor

        // 🚨 AICI AR TREBUI SĂ AI ȘI LOGICA DE SALVARE ÎN MONGODB!
    });
    
    socket.on('disconnect', () => {
        console.log(`Un utilizator s-a deconectat: ${socket.id}`);
    });
});
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/renovari", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectat la MongoDB!"))
  .catch((err) => console.log("❌ Eroare MongoDB:", err));

// 🧩 Rute API
app.use("/api/interior", interiorRoute);
app.use("/api/pro", proRoutes);

// 🧪 Test
app.get("/", (req, res) => res.send("✅ Backend HomeBid activ!"));

// 🧠 REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Completează toate câmpurile!" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Există deja un cont cu acest email!" });

    const newUser = new User({ name, email, password: password });

    await newUser.save();
    res.status(201).json({ message: "Cont creat cu succes!" });
  } catch (error) {
    console.error("Eroare la înregistrare:", error);
    res.status(500).json({ message: "Eroare la server" });
  }
});

// 🔐 LOGIN
app.post("/api/login", async (req, res) => {
  try {
    console.log("📩 Cerere primită la /api/login:", req.body);
   
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email și parolă necesare!" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Emailul nu există." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Parolă incorectă." });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({
      message: "Autentificare reușită!",
      token: token,
      userId: user._id,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("❌ Eroare la /api/login:", error);
    res.status(500).json({ message: "Eroare server", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server pornit pe portul ${PORT}`));
