// models/WorkRequest.js
import mongoose from 'mongoose';

const WorkRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true }, // 'interioare', 'exterioare', etc.
  description: { type: String, required: true },
  squareMeters: { type: Number, required: true },
  county: { type: String, required: true },
  materialQuality: { type: String, required: true },
  
  // Detalii extra pentru exterior sau case la rosu
  specificDetails: { type: Object, default: {} },

  // Câmpuri opționale care apăreau în formularul tău de interior
  name: { type: String },
  phone: { type: String },
  email: { type: String }, // email-ul de contact din formular
  images: { type: [String], default: [] },
  
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WorkRequest', WorkRequestSchema);