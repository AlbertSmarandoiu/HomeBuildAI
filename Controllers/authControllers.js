
import User from "../models/user.js";
import jwt from "jsonwebtoken";
export const register = async (req, res) => { // <-- DECOMENTEAZĂ SAU ADAUGĂ ASTA
    try {
        const { name, email, password } = req.body;
        
        // 🚨 Role implicit 'user', deoarece ai simplificat frontend-ul
        const role = 'user'; 
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email deja folosit" });

        // 🛑 ELIMINĂ ORICE HASHING EXPLICIT AICI (ex: NU folosi bcrypt.hash)
        // Hook-ul pre('save') din modelul User va hasha automat parola.
        const user = await User.create({ name, email, password, role }); 

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

        // 1. Găsește userul
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Utilizator negăsit." });
        }

        // 2. Compară parola (FOLOSEȘTE METODA DIN MODEL)
        const isMatch = await user.comparePassword(password); // 👈 Folosești metoda corectă?
        if (!isMatch) {
            // Dacă aici e problema, serverul răspunde 'Parolă incorectă'
            return res.status(400).json({ message: "Email sau parolă incorecte." });
        }

        // 3. Creează și trimite Token-ul
        // Dacă serverul rămâne blocat ("nu se mai încarcă"), eroarea e probabil AICI.
        // Verifică dacă funcția ta de generare JWT/token-ul cauzează o eroare sau un loop.
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