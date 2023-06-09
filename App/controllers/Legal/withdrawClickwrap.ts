//-- Clients --//
import { Mongo, MongoClient } from "../../../index.js";
import retry from "async-retry";

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import {
  IClickwrapLog,
  IClickwrapLog_Mongo,
  IClickwrapUserStatus,
  IClickwrapUserStatus_Mongo,
} from "./clickwrap_types.js";
import { ObjectId } from "bson";
import getUserAuth0Id from "../../utils/getUserAuth0Id.js";

//-- ********************* Withdraw Consent ********************* --//
export const withdrawClickwrap = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_db_id = getUserDbId(req);
  let { foo } = req.params; // for route like 'some_route/:foo'
  const body: { title: string } = req.body;
  const { title } = body;

  if (!foo) {
    return res.status(400).send("Missing foo param");
  }

  try {
    await retry(
      async () => {
        // write to auth0 - remove clickwrap agreement date/version from user's accessToken user_metadata
        // write to mongodb - add the revocation, update the user's status to "active agreement" to "false"?
        // return res.json(data)
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send("error message while trying to beep boop");
  }
};
