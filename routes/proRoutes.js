import express from "express";
import Pro from "../models/Pro.js";
const router = express.Router();

// POST /api/pro - Înregistrare
router.post("/", async (req, res) => {
  try {
    const newPro = new Pro(req.body);
    await newPro.save();
    res.status(201).json({ message: "Firma înregistrată cu succes!" });
  } catch (err) {
    res.status(500).json({ message: "Eroare la înregistrare" });
  }
});

// ✅ POST /api/pro/login - Autentificare
router.post("/login", async (req, res) => {
  const { contactEmail, password } = req.body;
  try {
    const pro = await Pro.findOne({ contactEmail, password });
    if (!pro) return res.status(401).json({ message: "Date de conectare incorecte" });
    res.json({ message: "Conectare reușită", pro });
  } catch (err) {
    res.status(500).json({ message: "Eroare la server" });
  }
});

export default router;
