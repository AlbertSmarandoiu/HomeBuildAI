import express from "express";
import bcrypt from "bcrypt";
import Pro from "../models/Pro.js";

const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const { companyName, contactEmail, cui, telefon, password, skills } = req.body;

    if (!companyName || !contactEmail || !password)
      return res.status(400).json({ message: "Completează toate câmpurile!" });

    const existing = await Pro.findOne({ contactEmail });
    if (existing)
      return res.status(400).json({ message: "Emailul este deja folosit!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPro = new Pro({
      companyName,
      contactEmail,
      cui,
      telefon,
      password: hashedPassword,
      skills: skills || [], // 👈 salvează abilitățile
      date: new Date(),
    });

    await newPro.save();
    res.status(201).json({ message: "Firma înregistrată cu succes!", pro: newPro });
  } catch (error) {
    console.error("Eroare la înregistrare:", error);
    res.status(500).json({ message: "Eroare server" });
  }
});

// 🔹 Login firmă
router.post("/login", async (req, res) => {
  try {
    const { contactEmail, password } = req.body;
    const pro = await Pro.findOne({ contactEmail });

    if (!pro)
      return res.status(400).json({ message: "Email sau parolă incorecte!" });

    const isMatch = await bcrypt.compare(password, pro.password);
    if (!isMatch)
      return res.status(400).json({ message: "Email sau parolă incorecte!" });

    res.status(200).json({
      message: "Autentificare reușită!",
      proId: pro._id,
      companyName: pro.companyName,
      skills: pro.skills, // 👈 ADAUGĂ ASTA
    });
  } catch (error) {
    console.error("Eroare la login:", error);
    res.status(500).json({ message: "Eroare server" });
  }
});

export default router;
