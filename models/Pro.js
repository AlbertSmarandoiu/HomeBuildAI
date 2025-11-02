import mongoose from "mongoose";

const proSchema = new mongoose.Schema({
  companyName: String,
  contactEmail: { type: String, unique: true },
  cui: String,
  telefon: String,
  password: String,
  skills: [String],
  date: Date,
});

export default mongoose.model("Pro", proSchema);
