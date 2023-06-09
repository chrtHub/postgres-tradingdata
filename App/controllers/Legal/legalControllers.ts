//-- AWS client(s) --//

//-- Database Clients --//
import { knex } from "../../../index";
import { Mongo, MongoClient } from "../../../index.js";
import axios from "axios";
import retry from "async-retry";

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../../App/utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";

//-- ********************* Grant Consent ********************* --//
export const grant_consent = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  const body: { title: string } = req.body;
  const { title } = body;

  //-- Start MongoClient session to use for transactions --//
  const mongoSession = MongoClient.startSession({
    causalConsistency: false,
  });

  try {
    await retry(
      async () => {
        //-- Start Transaction --//
        mongoSession.startTransaction();
        //-- Transaction function --//
        const transaction = async () => {
          //-- (1/2) Write to MongoDB clickwrapLogs --//
          Mongo.clickwrapLogs.insertOne({}, { session: mongoSession }); // TODO

          //-- (2/2) Write to MongoDB clickwrapUserStatus --//
          Mongo.clickwrapUserStatus.updateOne(
            {},
            {},
            { session: mongoSession }
          ); // TODO
        };
        //-- Execute transaction --//
        await transaction();

        //-- Commit transaction --//
        await mongoSession.commitTransaction();
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
        onRetry: async () => {
          if (mongoSession.inTransaction()) {
            await mongoSession.abortTransaction();
          }
        },
      }
    );

    //-- Update user's metatdata in their Auth0 access token --//
    // TODO

    // return res.json(data)
  } catch (err) {
    console.log(err);
    return res.status(500).send("error message while trying to beep boop");
  }
};

//-- ********************* Withdraw Consent ********************* --//
export const withdraw_consent = async (
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
