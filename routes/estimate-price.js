import express from "express";
dotenv.config(); // trebuie să fie înainte de `new OpenAI(...)`
import { OpenAI } from "openai";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const mongoClient = new MongoClient(process.env.MONGO_URI);


router.post("/estimate-price", async (req, res) => {
  const { userId, squareMeters, works, images } = req.body;

  if (!squareMeters || !works || works.length === 0) {
    return res.status(400).json({ error: "Datele sunt incomplete." });
  }

  const prompt = `
Estimează un preț aproximativ pentru lucrări interioare într-un spațiu de ${squareMeters} mp.
Tipuri de lucrări: ${works.join(", ")}.
Imaginea nu este disponibilă, dar presupune o lucrare standard.
Returnează doar prețul estimativ și o scurtă explicație.
`;

  try {
    await mongoClient.connect(); // 🔹 asigură-te că e conectat
    const db = mongoClient.db("homebuild");
    const collection = db.collection("estimates");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0].message.content;

    await collection.insertOne({
      userId,
      squareMeters,
      works,
      images,
      response,
      createdAt: new Date(),
    });

    res.json({ success: true, estimate: response });
  } catch (error) {
    console.error("Eroare estimare:", error);
    res.status(500).json({ error: "Estimarea a eșuat." });
  }
});
export default router;