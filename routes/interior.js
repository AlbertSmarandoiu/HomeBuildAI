
// import express from "express";
// import WorkRequest from "../models/WorkRequest.js";
// import { createRequest } from '../Controllers/requestController.js'; 
// import verifyToken from '../middleware/authMiddleware.js';
// const router = express.Router();
// // import { extractStructuredTasks, calculateFinalCost } from '../Controllers/estimationController.js';
// // import sendPriceEstimateEmail from '../utils/emailService.js';

// // 1. Ruta de creare cerere
// router.post("/", verifyToken, createRequest);

// // 2. Ruta de filtrare (Aici am curățat totul)
// router.get("/filtered", async (req, res) => {
//     try {
//         const skillsQuery = req.query.skills; 

//         if (!skillsQuery) {
//              console.log("⚠️ Atenție: Nu au fost trimise skill-uri în URL.");
//              return res.status(200).json([]); 
//         }

//         // Procesăm skill-urile și forțăm litere mici
//         const proSkills = skillsQuery.split(',').map(s => s.trim().toLowerCase()); 
        
//         console.log("🔍 Căutăm joburi pentru categoriile:", proSkills);

//         const requests = await WorkRequest.find({
//             category: { $in: proSkills }, 
//             status: 'pending' 
//         }).sort({ createdAt: -1 });

//         console.log("✅ Cereri găsite în DB:", requests.length);
//         res.status(200).json(requests);

//     } catch (error) {
//         console.error("❌ Eroare la filtrare:", error);
//         res.status(500).json({ message: "Eroare server la filtrare." });
//     }
// });

// // 3. Ruta de numărare cereri
// router.get("/count/:userId", async (req, res) => {
//     try {
//         const count = await WorkRequest.countDocuments({ 
//             userId: req.params.userId
//         });
//         res.status(200).json({ count }); 
//     } catch (error) {
//         res.status(500).json({ message: "Eroare la numărare." });
//     }
// });

// export default router;
import express from "express";
import WorkRequest from "../models/WorkRequest.js";
import { createRequest } from '../Controllers/requestController.js'; 
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Ruta de creare cerere
router.post("/", verifyToken, createRequest);

// 2. Ruta de filtrare
router.get("/filtered", async (req, res) => {
    try {
        const skillsQuery = req.query.skills; 

        if (!skillsQuery) {
             return res.status(200).json([]); 
        }

        const proSkills = skillsQuery.split(',')
            .map(s => s.trim().toLowerCase()); 
        
        const requests = await WorkRequest.find({
            category: { $in: proSkills }, 
            status: 'pending' 
        }).sort({ createdAt: -1 });

        res.status(200).json(requests);

    } catch (error) {
        res.status(500).json({ message: "Eroare server la filtrare." });
    }
});
// 2. Ruta de filtrare
// router.get("/filtered", async (req, res) => {
//     try {
//         const skillsQuery = req.query.skills; 

//         if (!skillsQuery) {
//              return res.status(200).json([]); 
//         }

//         const proSkills = skillsQuery.split(',').map(s => s.trim().toLowerCase()); 
        
//         // 🌟 MODIFICAREA E AICI:
//         const requests = await WorkRequest.find({
//             category: { $in: proSkills }, 
//             status: 'pending' 
//         })
//         .populate('userId', 'profilePicture name') // <-- ASTA ADUCE POZA ȘI NUMELE!
//         .sort({ createdAt: -1 });

//         res.status(200).json(requests);

//     } catch (error) {
//         console.error("❌ Eroare la filtrare:", error);
//         res.status(500).json({ message: "Eroare server la filtrare." });
//     }
// });
// 3. Ruta de numărare cereri
router.get("/count/:userId", async (req, res) => {
    try {
        const count = await WorkRequest.countDocuments({ 
            userId: req.params.userId
        });
        res.status(200).json({ count }); 
    } catch (error) {
        res.status(500).json({ message: "Eroare la numărare." });
    }
});

export default router;