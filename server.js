import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import User from "./models/user.js"; // atenție la literele mici!
import estimatePriceRoute from "./routes/estimate-price.js";
dotenv.config();

const app = express();  
app.use(cors());
app.use(express.json());
app.use("/api", estimatePriceRoute);
console.log("DEBUG MONGO_URI =", process.env.MONGO_URI);

// 🔗 Conectare MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB!"))
  .catch((err) => console.log("❌ Eroare MongoDB:", err));

// 🧪 Ruta de test
app.get("/", (req, res) => {
  res.send("✅ Backend HomeBid activ!");
});

// 🧩 REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Toate câmpurile sunt obligatorii!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Emailul este deja folosit." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({
      message: "Cont creat cu succes!",
      user: { id: newUser._id, name, email, role },
    });
  } catch (error) {
    console.error("❌ Eroare la /api/register:", error);
    res.status(500).json({ message: "Eroare server", error: error.message });
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

// 🚀 PORNIM SERVERUL
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server pornit pe portul ${PORT}`));
