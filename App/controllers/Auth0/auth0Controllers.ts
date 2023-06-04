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
  let user_auth0_id = getUserAuth0Id(req);

  auth0ManagementClient.getUserPermissions(
    { id: user_auth0_id },
    (err, permissions) => {
      if (err) {
        console.log(err);
        return res.status(500).send("error getting user permissions");
      } else {
        console.log(
          `user with id ${user_auth0_id} has permissions: `,
          permissions
        );
        return res.status(200).send(permissions); // parse this client-side
      }
    }
  );
};

//-- ********************* Get User roles ********************* --//
export const getUserRoles = async (req: IRequestWithAuth, res: Response) => {
  let user_auth0_id = getUserAuth0Id(req);

  auth0ManagementClient.getUserRoles(
    {
      id: user_auth0_id,
    },
    (err, userRoles) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`user with id ${user_auth0_id} has roles: `, userRoles);
      }
    }
  );
};

//-- ********************* Assign Roles to User ********************* --//
export const assignRolesToUser = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_auth0_id = getUserAuth0Id(req);

  const body: { namesOfRolesToAssign: string[] } = req.body;
  console.log(body); // DEV
  const { namesOfRolesToAssign } = body; // DEV - e.g. ["Free-Preview-Access"]

  if (!namesOfRolesToAssign) {
    return res.status(400).send("Missing namesOfRolesToAssign in body");
  }

  //-- Assign Roles to User --//
  auth0ManagementClient.assignRolestoUser(
    { id: user_auth0_id },
    { roles: namesOfRolesToAssign.map((role) => ROLE_IDS[role]) },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          `Added ${namesOfRolesToAssign} to user with id ${user_auth0_id}`
        );
      }
    }
  );
};

//-- ********************* Remove Roles from User ********************* --//
export const removeRolesFromUser = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_auth0_id = getUserAuth0Id(req);

  const body: { namesOfRolesToRemove: string[] } = req.body;
  console.log(body); // DEV
  const { namesOfRolesToRemove } = body; // DEV - e.g. ["Free-Preview-Access"]

  if (!namesOfRolesToRemove) {
    return res.status(400).send("Missing namesOfRolesToRemove in body");
  }

  auth0ManagementClient.removeRolesFromUser(
    { id: user_auth0_id },
    { roles: namesOfRolesToRemove.map((role) => ROLE_IDS[role]) },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          `Removed ${namesOfRolesToRemove} from user with id ${user_auth0_id}`
        );
      }
    }
  );
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
