import express from "express";
import InteriorRequest from "../models/InteriorRequest.js";
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const newRequest = new InteriorRequest(req.body);
    await newRequest.save();
    res.status(201).json({ message: "Cerere salvată cu succes!" });
  } catch (error) {
    res.status(500).json({ message: "Eroare la salvare!", error });
  }
});

router.get("/", async (req, res) => {
  const requests = await InteriorRequest.find().sort({ date: -1 });
  res.json(requests);
});

export default router;
