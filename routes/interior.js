import express from "express";
import InteriorRequest from "../models/InteriorRequest.js";

const router = express.Router();

// 📨 POST - trimite cerere nouă
router.post("/", async (req, res) => {
  try {
    const { description, squareMeters, county, images, userId } = req.body;

    if (!description || !squareMeters || !county) {
      return res.status(400).json({ message: "Toate câmpurile sunt obligatorii!" });
    }

    const newRequest = new InteriorRequest({
      description,
      squareMeters,
      county,
      images,
      userId,
    });

    await newRequest.save();
    res.status(201).json({ message: "Cerere salvată cu succes!", request: newRequest });
  } catch (error) {
    console.error("❌ Eroare la salvare cerere:", error);
    res.status(500).json({ message: "Eroare server", error: error.message });
  }
});

// 📋 GET - pentru constructor (toate cererile)
router.get("/", async (req, res) => {
  try {
    const requests = await InteriorRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Eroare la încărcarea cererilor" });
  }
});

export default router;
