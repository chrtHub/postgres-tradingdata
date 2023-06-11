//-- Clients --//
import { Mongo } from "../../../index.js";
import { auth0ManagementClient } from "../../../index.js";
import { AUTH0_ROLE_IDS } from "./AUTH0_ROLE_IDS.js";

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
export const assignFreePreview = async (
  req: IRequestWithAuth,
  res: Response
) => {
  const user_db_id = getUserDbId(req);
  const user_auth0_id = getUserAuth0Id(req);

  //-- check clickwrap status before assigning a role --//
  let clickwrapUserStatus = await Mongo.clickwrapUserStatus.findOne({
    user_db_id: user_db_id,
  });
  //-- SECURITY --//
  if (!clickwrapUserStatus?.activeAgreement) {
    return res
      .status(403)
      .send("clickwrap agreements must be in place to add a role");
  }

  const namesOfRolesToAssign = ["Free Preview"]; //-- EXTREMELY SENSITIVE (SECURITY RISK) --//

  //-- Create array of role ids --//
  const idsOfRolesToAssign = AUTH0_ROLE_IDS.filter((role) =>
    namesOfRolesToAssign.includes(role.name)
  ).map((role) => role.id);

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
