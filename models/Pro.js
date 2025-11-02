import mongoose from "mongoose";

const ProSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  cui: { type: String, required: true },
  telefon: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Pro", ProSchema);
