
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
export const register = async (req, res) => { // <-- DECOMENTEAZĂ SAU ADAUGĂ ASTA
    try {
        const { name, email, password } = req.body;
        
        // 🚨 Role implicit 'user', deoarece ai simplificat frontend-ul
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email deja folosit" });
        //const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email,password, role: 'user' });
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        res.status(201).json({ 
            user: { id: user._id, name: user.name, email: user.email, role: user.role }, 
            token 
        });
        
    } catch (err) {
        console.error(err);
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
        const isMatch = await user.comparePassword(password); // 👈 Folosești metoda corectă?
        //const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Dacă aici e problema, serverul răspunde 'Parolă incorectă'
            return res.status(400).json({ message: "Email sau parolă incorecte." });
        }

        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({ 
            message: "Autentificare reușită!", 
            token, 
            userId: user._id 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Eroare server la login." });
    }
};
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "Utilizator negăsit." });
        }
        
        // Câmpul 'name' poate lipsi, deci trimitem tot obiectul user
        res.status(200).json(user);
    } catch (error) {
        console.error("Eroare la preluarea profilului:", error);
        res.status(400).json({ message: "ID utilizator invalid." });
    }
};
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { name } = req.body;
        
        // Actualizăm doar câmpul 'name'
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilizator negăsit." });
        }

        res.status(200).json({ message: "Profil actualizat!", user: updatedUser });
    } catch (error) {
        console.error("Eroare la actualizarea profilului:", error);
        res.status(500).json({ message: "Eroare server la actualizare." });
    }
};