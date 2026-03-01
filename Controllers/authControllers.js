import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email deja folosit" });

        // STERGEM linia cu hashedPassword! Lăsăm modelul User să facă asta automat.
        const user = await User.create({ 
            name, 
            email, 
            password, // Trimitem parola curată, modelul o va hashui la save
            role: 'user' 
        });
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        res.status(201).json({ 
            user: { id: user._id, name: user.name, email: user.email, role: user.role }, 
            token 
        });
        
    } catch (err) {
        console.error("Eroare register:", err);
        res.status(500).json({ message: "Eroare la înregistrare: " + err.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Utilizator negăsit." });
        }

        // Folosim bcrypt direct dacă metoda din model dă rateuri
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: "Email sau parolă incorecte." });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({ 
            message: "Autentificare reușită!", 
            token, 
            userId: user._id 
        });
    } catch (error) {
        console.error("Eroare login:", error);
        res.status(500).json({ message: "Eroare server la login." });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: "Utilizator negăsit." });
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: "ID utilizator invalid." });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            { name: req.body.name },
            { new: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: "Utilizator negăsit." });
        res.status(200).json({ message: "Profil actualizat!", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Eroare server la actualizare." });
    }
};