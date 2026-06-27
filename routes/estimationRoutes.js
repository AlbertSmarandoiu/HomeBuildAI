import express from "express";
import { getPriceEstimate } from "../../controllers/estimationController.js";

const router = express.Router();

router.get("/estimate", getPriceEstimate);

export default router;