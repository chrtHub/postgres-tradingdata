//-- AWS Client --//

//-- Database Clients --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- Express router --//
import express from "express";
const router = express.Router();

//-- Middleware --//

//-- Controllers --//
import { getUserRolesWithPermissions } from "../controllers/Auth0/getUserRolesWithPermissions.js";
import { assignFreePreview } from "../controllers/Auth0/assignFreePreview.js";
import { removeFreePreview } from "../controllers/Auth0/removeFreePreview.js";

//-- ********** Routes ********** --//
router.get("/get_user_roles_with_permissions", getUserRolesWithPermissions); //-- No middleware --//

router.post("/assign_roles_to_user/free_preview", assignFreePreview); //-- No middleware --//

router.delete("/remove_roles_from_user/free_preview", removeFreePreview); //-- No middleware --//

//-- ********** Export ********** --//
export default router;
