const express = require("express");
const router = express.Router();
const Firma = require("../models/firma");

// POST /api/firma - înregistrare firmă
router.post("/", async (req, res) => {
  const { numeFirma, emailContact, cui, telefon } = req.body;

  if (!numeFirma || !emailContact || !cui || !telefon) {
    return res.status(400).json({ message: "Toate câmpurile sunt obligatorii." });
  }

  try {
    const firmaExistenta = await Firma.findOne({ emailContact });
    if (firmaExistenta) {
      return res.status(409).json({ message: "Această firmă este deja înregistrată." });
    }

    const firmaNoua = new Firma({ numeFirma, emailContact, cui, telefon });
    await firmaNoua.save();

    res.status(201).json({ message: "Firma a fost înregistrată cu succes." });
  } catch (error) {
    console.error("Eroare la înregistrarea firmei:", error);
    res.status(500).json({ message: "Eroare de server. Încearcă din nou mai târziu." });
  }
});

module.exports = router;
// GET /api/firma - obține toate firmele
router.get("/", async (req, res) => {
  try {
    const firme = await Firma.find().sort({ dataCrearii: -1 });
    res.status(200).json(firme);
  } catch (error) {
    console.error("Eroare la preluarea firmelor:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});

// PUT /api/firma/:id/approve - aprobă o firmă
router.put("/:id/approve", async (req, res) => {
  try {
    const firma = await Firma.findByIdAndUpdate(
      req.params.id,
      { status: "aprobat" },
      { new: true }
    );
    if (!firma) return res.status(404).json({ message: "Firma nu a fost găsită." });
    res.json({ message: "Firma aprobată cu succes!", firma });
  } catch (error) {
    console.error("Eroare la aprobarea firmei:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});

// PUT /api/firma/:id/reject - respinge o firmă
router.put("/:id/reject", async (req, res) => {
  try {
    const firma = await Firma.findByIdAndUpdate(
      req.params.id,
      { status: "respins" },
      { new: true }
    );
    if (!firma) return res.status(404).json({ message: "Firma nu a fost găsită." });
    res.json({ message: "Firma respinsă.", firma });
  } catch (error) {
    console.error("Eroare la respingerea firmei:", error);
    res.status(500).json({ message: "Eroare de server." });
  }
});

// GET /api/firma - obține toate firmele
// router.get("/", async (req, res) => {
//   try {
//     const firme = await Firma.find();
//     res.status(200).json(firme);
//   } catch (error) {
//     console.error("Eroare la preluarea firmelor:", error);
//     res.status(500).json({ message: "Eroare server" });
//   }
// });
