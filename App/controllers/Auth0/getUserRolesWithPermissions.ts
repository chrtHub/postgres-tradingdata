//-- Clients --//
import { auth0ManagementClient } from "../../../index.js";

//-- TypeScript --//

//-- NPM Functions --//

//-- Utility Functions --//
import getUserAuth0Id from "../../utils/getUserAuth0Id.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import { RoleWithPermissions } from "./Auth0.d";

//-- ********************* Get User Roles With Permissions ********************* --//
export const getUserRolesWithPermissions = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_auth0_id = getUserAuth0Id(req);

  if (auth0ManagementClient) {
    const rolesWithPermissions: RoleWithPermissions[] = [];

    //-- Get user's roles --//
    try {
      const userRoles = await auth0ManagementClient.getUserRoles({
        id: user_auth0_id,
      });

      //-- Loop over roles --//
      for (const role of userRoles) {
        if (role.id && role.name && role.description) {
          try {
            //-- Get permissions for role --//
            const permissionsInRole =
              await auth0ManagementClient.getPermissionsInRole({ id: role.id });

            //-- Build array of permission names --//
            const permissions: string[] = [];
            permissionsInRole.forEach((permission) => {
              if (permission.permission_name) {
                permissions.push(permission.permission_name);
              }
            });

            //-- Build array of roles with permissions --//
            rolesWithPermissions.push({
              role_name: role.name,
              role_description: role.description,
              permissions: permissions,
            });
          } catch (err) {
            console.log(err); //-- prod --//
          }
        }
      }
      return res.status(200).send(rolesWithPermissions);
      //----//
    } catch (err) {
      console.log(err); //-- prod --//
      return res.status(500).send("error getting user permissions");
    }
  } else {
    return res.status(500).send("Request to Auth0 failed");
  }
};
