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
import authRoutes from './routes/auth.js';
import interiorRoutes from './routes/interior.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/messages", messagesRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/interiorrequests", interiorRoutes);
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
    socket.on('join', (userId) => {
        socket.join(userId); 
        console.log(`Utilizatorul ${userId} s-a alăturat camerei.`);
    });
    socket.on('sendMessage', async (messageData) => {
        io.to(messageData.receiverId).emit('message', messageData);
        io.to(messageData.senderId).emit('message', messageData); 
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

app.use("/api/pro", proRoutes);
//app.use("/api/interior", interiorRoute); // 🚨 RUTA VECHE/DUPLICATĂ (Poate crea conflict)
app.get("/", (req, res) => res.send(" Backend HomeBid activ!"));

const PORT = process.env.PORT || 5000;
//app.listen(PORT, () => console.log(` Server pornit pe portul ${PORT}`));
httpServer.listen(PORT, () => {
    console.log(`✅ Server (Express + Socket.IO) pornit pe portul ${PORT}`);
});
