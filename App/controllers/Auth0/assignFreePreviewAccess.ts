// import { promisify } from "util";

//-- Clients --//
import { auth0ManagementClient } from "../../../index.js";
import { AUTH0_ROLE_IDS } from "./Auth0Roles.js";

//-- NPM Functions --//

//-- Utility Functions --//
import getUserAuth0Id from "../../utils/getUserAuth0Id.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import getUserDbId from "../../utils/getUserDbId.js";

// TODO - with all requests, can provide a X-Correlation-ID as HTTP header for tracking purposes, up to 64 chars
// // how to do this with the management client?

//-- ********************* Assign Roles to User ********************* --//
export const assignFreePreviewAccess = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_auth0_id = getUserAuth0Id(req);

  //-- Name(s) --> ID(s) of role(s) --//
  const namesOfRolesToAssign = ["Free Preview Access"]; //-- EXTREMELY SENSITIVE (SECURITY RISK) --//
  const idsOfRolesToAssign = namesOfRolesToAssign.map(
    (roleName) => AUTH0_ROLE_IDS[roleName]
  );

  //-- Assign Roles to User --//
  if (auth0ManagementClient) {
    try {
      await auth0ManagementClient.assignRolestoUser(
        { id: user_auth0_id }, //-- Security --//
        { roles: idsOfRolesToAssign }
      );

      return res.status(200).json({
        roles: namesOfRolesToAssign,
        user_db_id: getUserDbId(req),
      });
    } catch (err) {
      return res.status(500).send("error assigning role to user");
    }
  } else {
    return res.status(500).send("No server connection to Auth0 established");
  }
};
