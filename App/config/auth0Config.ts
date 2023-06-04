import { promisify } from "util";
import { ManagementClient } from "auth0";

// lackluster explanation from node-auth0/examples.md - https://github.com/auth0/node-auth0/blob/master/EXAMPLES.md

// Does this automatically get fresh token?
const auth0ManagementClient = new ManagementClient({
  domain: "{YOUR_ACCOUNT}.auth0.com",
  clientId: "", // Make sure your clientId is allowed to request tokens from Management API in Auth0 Dashboard - https://manage.auth0.com/#/apis
  clientSecret: "",
  scope: "",
  telemetry: false,
  //   audience: "",
});

// with all requests, can provide a X-Correlation-ID as HTTP header for tracking purposes, up to 64 chars
// // how to do this with the management client?

//-- Params --//
const ROLE_IDS: { [key: string]: string } = {
  "Free-Preview-Access": "rol_7dV89O6JJGMOqfz1",
};
const AARON_CARVER_ID: string = "google-oauth2|113725528803072296942";
let role_name = "Free-Preview-Access";

//-- USER ROLES --//
//-- Get User Permissions --//
auth0ManagementClient.getUserPermissions(
  { id: AARON_CARVER_ID },
  (err, permissions) => {
    if (err) {
      console.log(err);
    } else {
      console.log(
        `user with id ${AARON_CARVER_ID} has permissions: `,
        permissions
      );
    }
  }
);

//-- Get User Roles --//
auth0ManagementClient.getUserRoles(
  {
    id: AARON_CARVER_ID,
  },
  (err, userRoles) => {
    console.log(err);
    console.log(`user with id ${AARON_CARVER_ID} has roles: `, userRoles);
  }
);

//-- Assign Roles to User --//
const rolesToAssign: string[] = ["Free-Preview-Access"];
auth0ManagementClient.assignRolestoUser(
  { id: AARON_CARVER_ID },
  { roles: rolesToAssign },
  function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`Added ${rolesToAssign} to user with id ${AARON_CARVER_ID}`);
    }
  }
);

//-- Remove Roles from User --//
const rolesToRemove: string[] = ["Free-Preview-Access"];
auth0ManagementClient.removeRolesFromUser(
  { id: AARON_CARVER_ID },
  { roles: rolesToRemove },
  function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(
        `Removed ${rolesToRemove} from user with id ${AARON_CARVER_ID}`
      );
    }
  }
);

//-- ROLE INFORMATION --//
//-- Get Role --//
auth0ManagementClient.getRole(
  { id: ROLE_IDS[role_name] }, //----//
  (err, role) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`${role_name} role: `, role);
    }
  }
);

//-- Get Permissions in Role --//
auth0ManagementClient.getPermissionsInRole(
  { id: ROLE_IDS[role_name] },
  (err, permissions) => {
    if (err) {
      console.log(err);
    } else {
      console.log("permissions: ", permissions);
    }
  }
);

export default auth0ManagementClient;

// TODO - use promisified versions?
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

//   //-- Get Role --//
//   try {
//     const role = await getRoleAsync({ id: ROLE_IDS[role_name] });
//     console.log(`${role_name} role: `, role);
//   } catch (err) {
//     console.log(err);
//   }

//   //-- Get Permissions in Role --//
//   try {
//     const permissionsInRole = await getPermissionsInRoleAsync({ id: ROLE_IDS[role_name] });
//     console.log(permissionsInRole);
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
