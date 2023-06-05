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
import { assignRolesToUserFreePreviewAccess } from "../controllers/Auth0/assignRolesToUserFreePreviewAccess.js";
import { removeRolesFromUserFreePreviewAccess } from "../controllers/Auth0/removeRolesFromUserFreePreviewAccess.js";

//-- ********** Routes ********** --//
router.get(
  "/get_user_roles_with_permissions",
  ctrl.getUserRolesWithPermissions
); //-- No middleware --//
// router.get("/get_user_permissions", ctrl.getUserPermissions); //-- No middleware --//

router.post(
  "/assign_roles_to_user/free_preview_access",
  assignRolesToUserFreePreviewAccess
); //-- No middleware --//
router.delete(
  "/remove_roles_from_user/free_preview_access",
  removeRolesFromUserFreePreviewAccess
); //-- No middleware --//

//-- ********** Export ********** --//
export default router;
