//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/dataControllers.js";

//-- Express router --//
const router = express.Router();

//-- Routes --//
router.get("/", ctrl.fetchData);

//-- Export --//
export default router;
