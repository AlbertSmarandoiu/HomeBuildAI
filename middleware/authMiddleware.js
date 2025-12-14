// // middleware/authMiddleware.js

// import jwt from "jsonwebtoken";
// const verifyToken = (req, res, next) => {
//     // const TEST_SECRET = "secret_pentru_testare_12345";
//     // ... (Logica funcției protect/verifyToken)
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).json({ message: "Nu esti autentificat" });

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (err) {
//         res.status(401).json({ message: "Token invalid" });
//     }
// };

// // ✅ Fă exportul default al funcției
// export default verifyToken;
// middleware/authMiddleware.js (Funcția verifyToken)

import jwt from "jsonwebtoken";
// Presupunând că ai revenit la proces.env.JWT_SECRET după ultimul test
// Asigură-te că JWT_SECRET este același ca la login!

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.error("❌ EROARE 401: Token LIPSEȘTE!");
        return res.status(401).json({ message: "Nu ești autentificat (Token lipsă)." });
    }
    
    // 🚨 DEBUG: Afișează lungimea token-ului primit de server
    console.log(`✅ Token primit (Lungime): ${token.length}`); 

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // 🚨 DEBUG: Afișează conținutul decodat
        console.log("✅ Token Decodat:", decoded); 

        req.user = decoded;
        next(); // Continuă către ruta POST /
    } catch (err) {
        // 🚨 DEBUG: Dacă ajunge aici, token-ul e invalid
        console.error("❌ EROARE 401: Token invalid sau expirat. Motiv:", err.message); 
        return res.status(401).json({ message: "Token invalid sau expirat." });
    }
};

export default verifyToken;