// import { promisify } from "util";

//-- Clients --//
import { auth0ManagementClient } from "../../../index.js";

//-- NPM Functions --//
// import axios from "axios";
// import retry from "async-retry";

//-- Utility Functions --//
import getUserAuth0Id from "../../utils/getUserAuth0Id.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import getUserDbId from "../../utils/getUserDbId.js";

// TODO - with all requests, can provide a X-Correlation-ID as HTTP header for tracking purposes, up to 64 chars
// // how to do this with the management client?

//-- Params --//
const ROLE_IDS: { [key: string]: string } = {
  "Free-Preview-Access": "rol_7dV89O6JJGMOqfz1",
};

//-- ********************* Get User Permissions ********************* --//
export const getUserPermissions = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("getUserPermissions"); // DEV
  let user_auth0_id = getUserAuth0Id(req);

  //-- Get user permissions --//
  if (auth0ManagementClient) {
    auth0ManagementClient.getUserPermissions(
      { id: user_auth0_id },
      (err, userPermissions) => {
        if (err) {
          console.log(err); //- prod --//
          return res.status(500).send("error getting user permissions");
        } else {
          return res.status(200).send(userPermissions); // TODO - parse this client-side
        }
      }
    );
  } else {
    return res
      .status(500)
      .send("Auth0 Client not configured when NODE_ENV is development");
  }
};

//-- ********************* Get User roles ********************* --//
export const getUserRoles = async (req: IRequestWithAuth, res: Response) => {
  console.log("getUserRoles"); // DEV
  let user_auth0_id = getUserAuth0Id(req);

  //-- Get user roles --//
  if (auth0ManagementClient) {
    auth0ManagementClient.getUserRoles(
      { id: user_auth0_id },
      (err, userRoles) => {
        if (err) {
          console.log(err); //- prod --//
          return res.status(500).send("error getting user permissions");
        } else {
          return res.status(200).send(userRoles); // TODO - parse this client-side
        }
      }
    );
  } else {
    return res
      .status(500)
      .send("Auth0 Client not configured when NODE_ENV is development");
  }
};

// TODO - use promisified versions?

// try {
//   await retry(
//     async () => {
//       // axios, knex, or mongo call
//       // return res.json(data)
//       return res.status(200).send(`hello, world. title: ${title}`); // DEV
//     },
//     {
//       retries: 1,
//       minTimeout: 1000,
//       factor: 2,
//     }
//   );
// } catch (err) {
//   console.log(err);
//   return res.status(500).send("error message while trying to beep boop");
// }

// const getUserPermissionsAsync = promisify(
//     auth0ManagementClient.getUserPermissions
//   ).bind(auth0ManagementClient.getUserPermissions);
//   const getUserRolesAsync = promisify(auth0ManagementClient.getUserRoles).bind(
//     auth0ManagementClient
//   );
//   const getRoleAsync = promisify(auth0ManagementClient.getRole).bind(
//     auth0ManagementClient
//   );
//   const getPermissionsInRoleAsync = promisify(
//     auth0ManagementClient.getPermissionsInRole
//   ).bind(auth0ManagementClient);
//   const assignRolestoUserAsync = promisify(
//     auth0ManagementClient.assignRolestoUser
//   ).bind(auth0ManagementClient);

//   //-- Get User Permissions --//
// try {
//     const permissions = await getUserPermissionsAsync({ id: AARON_CARVER_ID });
//     console.log(`user with id ${AARON_CARVER_ID} has permissions: `, permissions);
//   } catch (err) {
//     console.log(err);
//   }

//   //-- Get User Roles --//
//   try {
//     const userRoles = await getUserRolesAsync({ id: AARON_CARVER_ID });
//     console.log(`user with id ${AARON_CARVER_ID} has roles: `, userRoles);
//   } catch (err) {
//     console.log(err);
//   }

//   //-- Assign Roles to User --//
//   try {
//     await assignRolestoUserAsync({ id: AARON_CARVER_ID }, { roles: rolesToAssign });
//     console.log(`Added ${rolesToAssign} to user with id ${AARON_CARVER_ID}`);
//   } catch (err) {
//     console.log(err);
//   }
