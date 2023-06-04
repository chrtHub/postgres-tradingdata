//-- AWS Client --//

//-- Database Clients --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- Express router --//
import express from "express";
const router = express.Router();

//-- Middleware --//

//-- Controllers --//
import { assignRole } from "../controllers/Auth0/assignRole.js";

//-- ********** Routes ********** --//

router.post("/assign_role", assignRole); //-- No middleware --//

//-- ********** Export ********** --//
export default router;
