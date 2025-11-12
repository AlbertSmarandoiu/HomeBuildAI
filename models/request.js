import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  address: String,
  budget: Number,
  category: {
    type: String,
    required: true,
    enum: [
      "interioare",
      "Lucrări exterioare",
      "Case la roșu",
      "Tencuieli",
      "Mobilă",
      "Debarasare",
      "Electrician",
      "Instalații sanitare",
      "Acoperișuri",
      "Gips-carton",
    ],
  },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Request", requestSchema);
