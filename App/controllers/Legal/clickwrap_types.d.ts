import { ObjectId } from "bson";

//-- Clickwrap document --//
export interface IClickwrapDocument {
  name: string;
  versionEffectiveDate: string;
  links: string[];
}
export interface IClickwrapDocument_Mongo {
  name: string;
  versionEffectiveDate: string;
  links: string[];
}

//-- Clickwrap Log --//
export interface IClickwrapLog {
  _id: string; //-- {MONGOIZE} ObjectId --//
  created_at: string; //-- {MONGOIZE} Date --//
  user_db_id: string;
  event: "grant_consent" | "withdraw_consent";
  documents: IClickwrapDocument[];
  otherAgreements: Object;
}
export interface IClickwrapLog_Mongo {
  _id: ObjectId; //-- MONGOIZED --//
  created_at: Date; //-- MONGOIZED --//
  user_db_id: string;
  event: "grant_consent" | "withdraw_consent";
  documents: IClickwrapDocument[];
  otherAgreements: Object;
}

//-- Clickwrap User Status --//
export interface IClickwrapUserStatus {
  _id: string; //-- {MONGOIZE} ObjectId --//
  last_edited: string; //-- {MONGOIZE} Date --//
  user_db_id: string;
  activeAgreement: boolean;
}
export interface IClickwrapUserStatus_Mongo {
  _id: ObjectId; //-- MONGOIZED --//
  last_edited: Date; //-- MONGOIZED --//
  user_db_id: string;
  activeAgreement: boolean;
}
