//-- Clients --//
import { auth0ManagementClient } from "../../../../index.js";

//-- TypeScript --//

//-- NPM Functions --//

//-- Utility Functions --//
import getUserAuth0Id from "../../../utils/getUserAuth0Id.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../../Types/index.js";
import { Role } from "auth0";

//-- ********************* Some Controller ********************* --//
export const getUserRoles = async (req: IRequestWithAuth, res: Response) => {
  let user_auth0_id = getUserAuth0Id(req);

  if (auth0ManagementClient) {
    let userRoles: Role[] = [];

    try {
      userRoles = await auth0ManagementClient.getUserRoles({
        id: user_auth0_id,
      });
      return userRoles;
    } catch (err) {
      console.log(err);
    }
  } else {
    return null;
  }
};
