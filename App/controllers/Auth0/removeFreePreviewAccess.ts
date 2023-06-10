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
import { AUTH0_ROLE_IDS } from "./Auth0Roles.js";

// TODO - with all requests, can provide a X-Correlation-ID as HTTP header for tracking purposes, up to 64 chars
// // how to do this with the management client?

//-- ********************* Remove Roles from User ********************* --//
export const removeFreePreviewAccess = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_auth0_id = getUserAuth0Id(req);

  //-- Name(s) --> ID(s) of role(s) --//
  const namesOfRolesToRemove = ["Free Preview Access"];
  const idsOfRolesToRemove = namesOfRolesToRemove.map(
    (role) => AUTH0_ROLE_IDS[role]
  );

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
