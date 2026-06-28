
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import messagesRoutes from './routes/messages.js';
import User from "./models/user.js";
import proRoutes from "./routes/proRoutes.js";
import interiorRoutes from './routes/interior.js';
import jwt from 'jsonwebtoken';
import portfolioRoutes from './routes/portfolio.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import { getPriceEstimate } from './Controllers/estimationController.js';
import offerRoutes from './routes/offers.js';
import reviewRoutes from './routes/reviews.js';
dotenv.config();

// 🔹 CREAM APP EXPRESS AICI
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use("/api/messages", messagesRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/interiorrequests", interiorRoutes);
app.use("/api/pro", proRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/reviews", reviewRoutes);
// Ruta test/estimate
app.get("/api/estimate", getPriceEstimate);

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    app.set('socketio', io);

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
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB Atlas (Cloud)!"))
  .catch((err) => console.log("❌ Eroare MongoDB:", err.message));

app.get("/", (req, res) => res.send("Backend HomeBid activ!"));

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server (Express + Socket.IO) pornit pe portul ${PORT}`);
});