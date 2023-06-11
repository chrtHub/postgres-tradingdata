// import { promisify } from "util";

//-- Clients --//
import { auth0ManagementClient } from "../../../index.js";

//-- NPM Functions --//

//-- Utility Functions --//
import getUserAuth0Id from "../../utils/getUserAuth0Id.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import getUserDbId from "../../utils/getUserDbId.js";

//-- Data --//
import { AUTH0_ROLE_IDS } from "./AUTH0_ROLE_IDS.js";

// TODO - with all requests, can provide a X-Correlation-ID as HTTP header for tracking purposes, up to 64 chars
// // how to do this with the management client?

//-- ********************* Remove Roles from User ********************* --//
export const removeFreePreview = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_auth0_id = getUserAuth0Id(req);

  //-- Create array of role ids - only works for roles in AUTH0_ROLE_IDS --//
  const namesOfRolesToRemove = ["Free Preview"];

  //-- Create array of role ids --//
  const idsOfRolesToRemove = AUTH0_ROLE_IDS.filter((role) =>
    namesOfRolesToRemove.includes(role.name)
  ).map((role) => role.id);

  //-- Remove roles from user --//
  if (auth0ManagementClient) {
    try {
      await auth0ManagementClient.removeRolesFromUser(
        { id: user_auth0_id }, //-- SECURITY --//
        { roles: idsOfRolesToRemove }
      );

      return res.status(200).json({
        roles: namesOfRolesToRemove,
        user_db_id: getUserDbId(req),
      });
    } catch (err) {
      console.log(err); //- prod --//
      return res.status(500).send("error removing role(s) from user");
    }
  } else {
    return res.status(500).send("No server connection to Auth0 established");
  }
};
