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
// ///---------------------------
// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import bcrypt from "bcrypt";
// import User from "./models/user.js"; // atenție la literele mici!
// //import estimatePriceRoute from "./routes/estimate-price.js";
// import proRoutes from "./routes/proRoutes.js";
// // import estimateRoutes from "./routes/estimate.js";
// dotenv.config();

// const app = express();  
// app.use(cors());
// app.use(express.json());
// //app.use("/api", estimatePriceRoute);
// console.log("DEBUG MONGO_URI =", process.env.MONGO_URI);
// import interiorRoute from "./routes/interior.js";
// app.use("/api/interior", interiorRoute);
// app.use("/api/pro", proRoutes);
// // app.use("/api/estimate", estimateRoutes);
// // 🔗 Conectare MongoDB
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ Conectat la MongoDB!"))
//   .catch((err) => console.log("❌ Eroare MongoDB:", err));

// // 🧪 Ruta de test
// app.get("/", (req, res) => {
//   res.send("✅ Backend HomeBid activ!");
// });

// // 🧩 REGISTER
// // app.post("/api/register", async (req, res) => {
// //   try {
// //     const { name, email, password, role } = req.body;

// //     if (!name || !email || !password || !role) {
// //       return res.status(400).json({ message: "Toate câmpurile sunt obligatorii!" });
// //     }

// //     const existingUser = await User.findOne({ email });
// //     if (existingUser) {
// //       return res.status(400).json({ message: "Emailul este deja folosit." });
// //     }

// //     const hashedPassword = await bcrypt.hash(password, 10);
// //     const newUser = new User({ name, email, password: hashedPassword, role });
// //     await newUser.save();

// //     res.status(201).json({
// //       message: "Cont creat cu succes!",
// //       user: { id: newUser._id, name, email, role },
// //     });
// //   } catch (error) {
// //     console.error("❌ Eroare la /api/register:", error);
// //     res.status(500).json({ message: "Eroare server", error: error.message });
// //   }
// // });



// app.post("/api/register", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "Completează toate câmpurile!" });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "Există deja un cont cu acest email!" });
//     }

//     // 🔒 Criptăm parola
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Salvăm utilizatorul nou
//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     await newUser.save();
//     res.status(201).json({ message: "Cont creat cu succes!" });
//   } catch (error) {
//     console.error("Eroare la înregistrare:", error);
//     res.status(500).json({ message: "Eroare la server" });
//   }
// });

// // 🔐 LOGIN
// app.post("/api/login", async (req, res) => {
//   try {
//     console.log("📩 Cerere primită la /api/login:", req.body);

//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ message: "Email și parolă necesare!" });

//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(400).json({ message: "Emailul nu există." });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.status(400).json({ message: "Parolă incorectă." });

//     res.status(200).json({
//       message: "Autentificare reușită!",
//       user: { id: user._id, name: user.name, email: user.email, role: user.role },
//     });
//   } catch (error) {
//     console.error("❌ Eroare la /api/login:", error);
//     res.status(500).json({ message: "Eroare server", error: error.message });
//   }
// });

// // 🚀 PORNIM SERVERUL
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server pornit pe portul ${PORT}`));


