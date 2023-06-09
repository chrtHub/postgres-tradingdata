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
  IClickwrapAgreement,
  IClickwrapLog_Mongo,
  IClickwrapUserStatus_Mongo,
} from "./clickwrap_types.js";
import { ObjectId } from "bson";

//-- Current Version Effective Dates --//
import {
  CURRENT_TERMS_DATE,
  CURRENT_COOKIES_DATE,
  CURRENT_PRIVACY_DATE,
  CURRENT_AGE_REQUIREMENT_STATEMENT,
} from "./currentAgreements.js";

//-- ********************* Grant Consent ********************* --//
export const grantClickwrap = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  //-- Receive agreement details --//
  const body: {
    TERMS_VERSION_EFFECTIVE_DATE: string;
    PRIVACY_VERSION_EFFECTIVE_DATE: string;
    COOKIES_VERSION_EFFECTIVE_DATE: string;
    AGE_REQUIREMENT_STATEMENT: string;
  } = req.body;
  const {
    TERMS_VERSION_EFFECTIVE_DATE,
    PRIVACY_VERSION_EFFECTIVE_DATE,
    COOKIES_VERSION_EFFECTIVE_DATE,
    AGE_REQUIREMENT_STATEMENT,
  } = body;

  //-- Verify all agreements were received, verify current Version Effective Dates, etc. --//
  if (
    !(TERMS_VERSION_EFFECTIVE_DATE === CURRENT_TERMS_DATE) ||
    !(PRIVACY_VERSION_EFFECTIVE_DATE === CURRENT_PRIVACY_DATE) ||
    !(COOKIES_VERSION_EFFECTIVE_DATE === CURRENT_COOKIES_DATE) ||
    !(AGE_REQUIREMENT_STATEMENT === CURRENT_AGE_REQUIREMENT_STATEMENT)
  ) {
    return res
      .status(400)
      .send("missing agreement or not current version effective dates");
  }

  //-- Build agreements array --//
  const agreements: IClickwrapAgreement[] = [
    {
      name: "Terms of Service",
      versionEffectiveDate: TERMS_VERSION_EFFECTIVE_DATE,
      links: [
        `https://chrt-legal-public.s3.amazonaws.com/${TERMS_VERSION_EFFECTIVE_DATE}-Terms.tsx`,
        `https://chrt-legal-public.s3.amazonaws.com/${TERMS_VERSION_EFFECTIVE_DATE}-Terms.pdf`,
      ],
    },
    {
      name: "Privacy Statement",
      versionEffectiveDate: PRIVACY_VERSION_EFFECTIVE_DATE,
      links: [
        `https://chrt-legal-public.s3.amazonaws.com/${PRIVACY_VERSION_EFFECTIVE_DATE}-PrivacyDoc.tsx`,
        `https://chrt-legal-public.s3.amazonaws.com/${PRIVACY_VERSION_EFFECTIVE_DATE}-PrivacyDoc.pdf`,
      ],
    },
    {
      name: "Cookies Policy",
      versionEffectiveDate: COOKIES_VERSION_EFFECTIVE_DATE,
      links: [
        `https://chrt-legal-public.s3.amazonaws.com/${COOKIES_VERSION_EFFECTIVE_DATE}-CookiesDoc.tsx`,
        `https://chrt-legal-public.s3.amazonaws.com/${COOKIES_VERSION_EFFECTIVE_DATE}-CookiesDoc.pdf`,
      ],
    },
    {
      name: AGE_REQUIREMENT_STATEMENT,
      versionEffectiveDate: "n/a",
      links: [],
    },
  ];

  //-- Start MongoClient session to use for transactions --//
  const mongoSession = MongoClient.startSession({
    causalConsistency: false,
  });

  //-- Clickwrap Log Document --//
  let clickwrapLog: IClickwrapLog_Mongo = {
    _id: new ObjectId(),
    created_at: new Date(),
    user_db_id: user_db_id, //-- Security --//
    event: "grant_consent",
    agreements: agreements,
  };

  //-- Clickwrap User Status Document --//
  let clickwrapUserStatus: IClickwrapUserStatus_Mongo = {
    last_edited: new Date(),
    user_db_id: user_db_id, //-- Security --//
    activeAgreement: true,
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
