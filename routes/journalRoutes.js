//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/journalControllers.js";

//-- Express router --//
const router = express.Router();

//-- Routes --//
router.get("/sales", ctrl.fetchSales);

//-- Export --//
export default router;
