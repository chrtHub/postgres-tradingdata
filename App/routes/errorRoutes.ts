//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/errorControllers.js";

//-- Express router --//
const router = express.Router();

//-- Routes --//
router.get("/", ctrl.backend418Error);
router.get("/500", ctrl.backend500Error);

//-- Export --//
export default router;
