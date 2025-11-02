import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🧠 Conectare la MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/renovari", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Eroare la MongoDB:"));
db.once("open", () => console.log("✅ Conectat la MongoDB"));

// 🧱 Schema pentru cereri
const requestSchema = new mongoose.Schema({
  description: String,
  squareMeters: String,
  county: String,
  materialQuality: String,
  images: [String],
  date: String,
});

const Request = mongoose.model("Request", requestSchema);

// 📥 POST — salvare cerere
app.post("/api/interior", async (req, res) => {
  try {
    const request = new Request(req.body);
    await request.save();
    res.status(201).json({ message: "Cererea a fost salvată cu succes!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Eroare la salvare" });
  }
});

// 📤 GET — listare cereri
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await Request.find().sort({ date: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Eroare la preluare date" });
  }
});

app.listen(5000, () => console.log("🚀 Server pornit pe portul 5000"));
