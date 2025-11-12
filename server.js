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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/messages", messagesRoutes);
// 🔗 Conectare la MongoDB
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

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

    res.status(200).json({
      message: "Autentificare reușită!",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("❌ Eroare la /api/login:", error);
    res.status(500).json({ message: "Eroare server", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server pornit pe portul ${PORT}`));
