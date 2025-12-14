import express from "express";
import { register, login, getUserProfile, updateUserProfile } from "../Controllers/authControllers.js";

const router = express.Router();
// router.get("/:userId", (req, res, next) => {
//     console.log(`📩 RUTA USER PROFIL ATINSĂ. ID: ${req.params.userId}`);
//     next(); // Permite continuarea către controller (getUserProfile)
// }, getUserProfile);
router.post("/register", register);
router.post("/login", login);

// 🚨 NOU: Rute pentru Profilul Userului (Client)
router.get("/:userId", getUserProfile);
router.patch("/:userId", updateUserProfile);

export default router;
