// const mongoose = require("mongoose");

// const firmaSchema = new mongoose.Schema({
//   numeFirma: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   emailContact: {
//     type: String,
//     required: true,
//     trim: true,
//     lowercase: true,
//   },
//   cui: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   telefon: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "aprobat", "respins"],
//     default: "pending",
//   },
//   dataCrearii: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Firma", firmaSchema);