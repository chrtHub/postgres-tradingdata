//-- AWS Client --//

//-- Database Clients --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- Express router --//
import express from "express";
const router = express.Router();

//-- Middleware --//

//-- Controllers --//
import * as ctrl from "../controllers/Auth0/auth0Controllers.js";

//-- ********** Routes ********** --//
router.get("/get_user_permissions", ctrl.getUserPermissions); //-- No middleware --//
router.get("/get_user_roles", ctrl.getUserRoles); //-- No middleware --//

router.post("/assign_roles_to_user", ctrl.assignRolesToUser); //-- No middleware --//
router.post("/remove_roles_from_user", ctrl.removeRolesFromUser); //-- No middleware --//

//-- ********** Export ********** --//
export default router;
