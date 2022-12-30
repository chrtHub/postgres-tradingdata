//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/journalControllers.js";

//-- Express router --//
const router = express.Router();

//-- Routes --//
router.get("/sales", ctrl.fetchSales);

//-- Reference --//
// router.post()
// router.delete()

//-- Export --//
export default router;
