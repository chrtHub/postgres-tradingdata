//-- Clients --//
import { Mongo, MongoClient } from "../../../index.js";
import retry from "async-retry";
import { auth0ManagementClient } from "../../../index.js";

//-- TypeScript --//
import { getUserRoles } from "../Auth0/Util/getUserRoles.js";

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../utils/getUserDbId.js";
import getUserAuth0Id from "../../utils/getUserAuth0Id.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import {
  IClickwrapAgreement,
  IClickwrapLog_Mongo,
  IClickwrapUserStatus_Mongo,
} from "./clickwrap_types.js";
import { Role } from "auth0";
import { ObjectId } from "bson";

//-- Data --//
import { AUTH0_ROLE_IDS } from "../Auth0/AUTH0_ROLE_IDS.js";

//-- Current Version Effective Dates --//
import {
  CURRENT_TERMS_EFFECTIVE_DATE,
  CURRENT_COOKIES_EFFECTIVE_DATE,
  CURRENT_PRIVACY_EFFECTIVE_DATE,
  CURRENT_AGE_REQUIREMENT_STATEMENT,
} from "./currentAgreements.js";

//-- ********************* Withdraw Consent ********************* --//
export const withdrawClickwrap = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_db_id = getUserDbId(req);
  let user_auth0_id = getUserAuth0Id(req);

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
    !(TERMS_VERSION_EFFECTIVE_DATE === CURRENT_TERMS_EFFECTIVE_DATE) ||
    !(PRIVACY_VERSION_EFFECTIVE_DATE === CURRENT_PRIVACY_EFFECTIVE_DATE) ||
    !(COOKIES_VERSION_EFFECTIVE_DATE === CURRENT_COOKIES_EFFECTIVE_DATE) ||
    !(AGE_REQUIREMENT_STATEMENT === CURRENT_AGE_REQUIREMENT_STATEMENT)
  ) {
    return res
      .status(400)
      .send("missing agreement or not current version effective dates");
  }

  //-- Get list of all Auth0 Roles --//
  let userRoles = await getUserRoles(req, res);

  //-- Create array of role ids - only works for roles in AUTH0_ROLE_IDS --//
  const idsOfRolesToRemove = AUTH0_ROLE_IDS.filter((role) =>
    userRoles?.some((userRole) => userRole.name === role.name)
  ).map((role) => role.id);

  //-- If no roles found, no need to remove roles --//
  if (!idsOfRolesToRemove || idsOfRolesToRemove.length === 0) {
    return res.status(200).send("Found no active roles needed removal");
  }

  //-- Remove roles from user --//
  if (auth0ManagementClient) {
    try {
      await auth0ManagementClient.removeRolesFromUser(
        { id: user_auth0_id }, //-- SECURITY --//
        { roles: idsOfRolesToRemove }
      );
    } catch (err) {
      console.log(err); //- prod --//
      return res.status(500).send("error removing role(s) from user");
    }
  } else {
    return res.status(500).send("No server connection to Auth0 established");
  }

  //-- Start MongoClient session to use for transactions --//
  const mongoSession = MongoClient.startSession({
    causalConsistency: false,
  });

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
    activeAgreement: false, //-- Highly Sensitive - Security --//
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

    return res.status(200).send("successfully withdrew agreements");
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send("error withdrawing agreements, please refresh and try again");
  }
};
