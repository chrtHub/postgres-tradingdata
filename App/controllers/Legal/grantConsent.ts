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

//-- ********************* Grant Consent ********************* --//
export const grantConsent = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  //-- Version effective dates --//
  const body: {
    TERMS_VERSION_EFFECTIVE_DATE: string;
    PRIVACY_VERSION_EFFECTIVE_DATE: string;
    COOKIES_VERSION_EFFECTIVE_DATE: string;
  } = req.body;
  const {
    TERMS_VERSION_EFFECTIVE_DATE,
    PRIVACY_VERSION_EFFECTIVE_DATE,
    COOKIES_VERSION_EFFECTIVE_DATE,
  } = body;

  //-- Start MongoClient session to use for transactions --//
  const mongoSession = MongoClient.startSession({
    causalConsistency: false,
  });

  let clickwrapLog: IClickwrapLog_Mongo = {
    _id: new ObjectId(),
    created_at: new Date(),
    user_db_id: user_db_id, //-- Security --//
    event: "grant_consent",
    documents: [
      {
        name: "Terms of Service",
        versionEffectiveDate: TERMS_VERSION_EFFECTIVE_DATE,
        links: [
          `https://chrt-legal.s3.amazonaws.com/${TERMS_VERSION_EFFECTIVE_DATE}/${TERMS_VERSION_EFFECTIVE_DATE}-Terms.tsx`,
          `https://chrt-legal.s3.amazonaws.com/${TERMS_VERSION_EFFECTIVE_DATE}/${TERMS_VERSION_EFFECTIVE_DATE}-Terms.pdf`,
        ],
      },
      {
        name: "Privacy Statement",
        versionEffectiveDate: PRIVACY_VERSION_EFFECTIVE_DATE,
        links: [
          `https://chrt-legal.s3.amazonaws.com/${PRIVACY_VERSION_EFFECTIVE_DATE}/${PRIVACY_VERSION_EFFECTIVE_DATE}-PrivacyDoc.tsx`,
          `https://chrt-legal.s3.amazonaws.com/${PRIVACY_VERSION_EFFECTIVE_DATE}/${PRIVACY_VERSION_EFFECTIVE_DATE}-PrivacyDoc.pdf`,
        ],
      },
      {
        name: "Cookies Policy",
        versionEffectiveDate: COOKIES_VERSION_EFFECTIVE_DATE,
        links: [
          `https://chrt-legal.s3.amazonaws.com/${COOKIES_VERSION_EFFECTIVE_DATE}/${COOKIES_VERSION_EFFECTIVE_DATE}-CookiesDoc.tsx`,
          `https://chrt-legal.s3.amazonaws.com/${COOKIES_VERSION_EFFECTIVE_DATE}/${COOKIES_VERSION_EFFECTIVE_DATE}-CookiesDoc.pdf`,
        ],
      },
    ],
    otherAgreements: [{ age: "18+" }],
  };

  let clickwrapUserStatus: IClickwrapUserStatus_Mongo = {
    _id: new ObjectId(),
    last_edited: new Date(), // always update
    user_db_id: user_db_id, //-- Security --//
    activeAgreement: true,
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
            //-- (1/2) Write to MongoDB clickwrapLogs --//
            Mongo.clickwrapLogs.insertOne(clickwrapLog, {
              session: mongoSession,
            }); // TODO
            //-- (2/2) Write to MongoDB clickwrapUserStatus --//
            Mongo.clickwrapUserStatus.updateOne(
              {},
              {}, // TODO
              { session: mongoSession }
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

    // return res.json(data)
  } catch (err) {
    console.log(err);
    return res.status(500).send("error message while trying to beep boop");
  }
};
