//-- Clients --//
import { Mongo, MongoClient } from "../../../index.js";
import retry from "async-retry";

//-- NPM Functions --//
import _ from "lodash";

//-- Utility Functions --//
import getUserDbId from "../../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../Types/index.js";
import {
  IClickwrapAgreement,
  IClickwrapLog_Mongo,
  IClickwrapUserStatus_Mongo,
} from "./Types/clickwrap_types.js";
import { ObjectId } from "bson";

//-- Current Version Effective Dates --//
import { CURRENT_AGREEMENTS } from "./Util/CURRENT_AGREEMENTS.js";

//-- ********************* Grant Consent ********************* --//
export const grantClickwrap = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  //-- Receive agreement details --//
  const body: {
    CURRENT_AGREEMENTS: Record<string, IClickwrapAgreement>;
  } = req.body;

  //-- Verify received agreements match current agreements --//
  if (!_.isEqual(body.CURRENT_AGREEMENTS, CURRENT_AGREEMENTS)) {
    return res.status(400).send("agreements versions mismatch");
  }

  //-- Build agreements array --//
  const agreements: IClickwrapAgreement[] = Object.values(CURRENT_AGREEMENTS);

  //-- Start MongoClient session to use for transactions --//
  const mongoSession = MongoClient.startSession({
    causalConsistency: false,
  });

  //-- Clickwrap Log Document --//
  let clickwrapLog: IClickwrapLog_Mongo = {
    _id: new ObjectId(),
    created_at: new Date(),
    user_db_id: user_db_id, //-- Security --//
    event: "grant_consent", //-- Security --//
    agreements: agreements,
  };

  //-- Clickwrap User Status Document --//
  let clickwrapUserStatus: IClickwrapUserStatus_Mongo = {
    last_edited: new Date(),
    user_db_id: user_db_id, //-- Security --//
    activeAgreement: true, //-- Highly Sensitive - Security --//
    agreements: agreements,
  };

  try {
    //-- Clickwrap Database Transaction --//
    try {
      await retry(
        async () => {
          //-- Start Transaction --//
          mongoSession.startTransaction();

          //-- Transaction function --//
          const transaction = async () => {
            //-- (1/2) Insert clickwrap log document --//
            await Mongo.clickwrapLogs.insertOne(clickwrapLog, {
              session: mongoSession,
            });

            //-- (2/2) Upsert clickwrapUserStatus --//
            await Mongo.clickwrapUserStatus.replaceOne(
              { user_db_id: clickwrapUserStatus.user_db_id }, //-- Security --//
              clickwrapUserStatus,
              { session: mongoSession, upsert: true }
            );
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
      //----//
    } catch (err) {
      console.log(err);
      //-- Abort transaction --//
      await mongoSession.abortTransaction();
      console.log(err);
    } finally {
      //-- End MongoClient session --//
      await mongoSession.endSession();
    }

    return res.status(200).send("successful agreement");
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send("error storing record of agreements, please refresh and try again");
  }
};
