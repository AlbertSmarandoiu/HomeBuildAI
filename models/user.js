import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // password: { type: String, required: true },
  password: { type: String, required: true, trim: true }, // 🚨 Adaugă trim: true
  //role: { type: String, enum: ["user", "constructor"], default: "user" }
}, { timestamps: true });

// Hash password înainte de salvare
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// models/user.js

// Verificare password la login
userSchema.methods.comparePassword = async function(password) {
    console.log("--- DEBUG COMPARARE PAROLA ---");
    console.log("Parola primită (simplă):", password);
    console.log("Hash salvat în DB:", this.password);
    
    // Asigură-te că bcrypt este importat (presupun că este în models/user.js)
    const isMatch = await bcrypt.compare(password, this.password);
    
    console.log("Rezultat compare:", isMatch);
    console.log("-------------------------------");

    return isMatch;
};

export default mongoose.model("User", userSchema);