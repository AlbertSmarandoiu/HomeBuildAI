// routes/estimate.js
import express from "express";
import InteriorRequest from "../models/InteriorRequest.js";
import Estimate from "../models/Estimate.js";
import { OpenAI } from "openai";
import nodemailer from "nodemailer";

const router = express.Router();

// Inițializăm clientul OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Transporter pentru email (folosește Gmail doar pentru teste)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * GENEREAZĂ O ESTIMARE AUTOMATĂ pentru o cerere dată
 * Endpoint: POST /api/estimate/:id
 */
router.post("/:id", async (req, res) => {
  try {
    const requestId = req.params.id;

    // 1️⃣ Preluăm cererea din DB
    const reqDoc = await InteriorRequest.findById(requestId);
    if (!reqDoc) {
      return res.status(404).json({ message: "Cererea nu a fost găsită!" });
    }

    // 2️⃣ Construim promptul pentru LLM
    const prompt = `
You are a professional construction cost estimator. 
Estimate the total cost for the following renovation request in Romania.
Return JSON only with fields:
{
  "total_estimate_RON": number,
  "labor_estimate_RON": number,
  "materials_estimate_RON": number,
  "breakdown": [{ "item": string, "quantity": string, "unit_price_RON": number, "subtotal_RON": number }],
  "assumptions": string,
  "confidence_percent": number
}

Request details:
Description: ${reqDoc.description || "N/A"}
Square meters: ${reqDoc.squareMeters || "N/A"}
County: ${reqDoc.county || "N/A"}
Material quality: ${reqDoc.materialQuality || "N/A"}
Images: ${reqDoc.images?.join(", ") || "none"}
    `;

    // 3️⃣ Trimitem cererea către modelul LLM
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // sau gpt-4-turbo / gpt-3.5-turbo
      messages: [
        { role: "system", content: "You are a professional cost estimator." },
        { role: "user", content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "{}";
    let estimateJSON;

    try {
      estimateJSON = JSON.parse(text);
    } catch (err) {
      estimateJSON = { rawText: text }; // dacă LLM a returnat text invalid
    }

    // 4️⃣ Salvăm estimarea în MongoDB
    const newEstimate = await Estimate.create({
      requestId,
      estimate: estimateJSON,
    });

    // 5️⃣ Trimitem email clientului (dacă are email)
    if (reqDoc.email) {
      const html = `
        <h2>Estimarea lucrării tale 🔧</h2>
        <p>Descriere: ${reqDoc.description}</p>
        <h3>Total estimat: ${estimateJSON.total_estimate_RON || "n/a"} RON</h3>
        <p><strong>Materiale:</strong> ${estimateJSON.materials_estimate_RON || "-"} RON</p>
        <p><strong>Manoperă:</strong> ${estimateJSON.labor_estimate_RON || "-"} RON</p>
        <pre>${JSON.stringify(estimateJSON.breakdown, null, 2)}</pre>
        <p><em>${estimateJSON.assumptions || ""}</em></p>
        <p>Mulțumim că ai folosit HomeBuildAI 💙</p>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: reqDoc.email,
        subject: "Estimare automată pentru lucrarea ta 🧱",
        html,
      });
    }

    // 6️⃣ Răspundem clientului
    res.json({
      message: "Estimare generată și trimisă cu succes!",
      estimate: estimateJSON,
    });
  } catch (error) {
    console.error("Eroare la estimare:", error);
    res.status(500).json({ message: "Eroare la generarea estimării", error });
  }
});

export default router;
