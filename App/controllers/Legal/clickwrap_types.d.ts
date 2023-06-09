import { ObjectId } from "bson";

//-- Clickwrap document --//
export interface IClickwrapDocument {
  name: string;
  versionEffectiveDate: string;
  link: string;
}
export interface IClickwrapDocument_Mongo {
  name: string;
  versionEffectiveDate: string;
  link: string;
}

//-- Clickwrap Log --//
export interface IClickwrapLog {
  _id: string; //-- {MONGOIZE} ObjectId --//
  created_at: string; //-- {MONGOIZE} Date --//
  event: "grant_consent" | "withdraw_consent";
  documents: IClickwrapDocument[];
  other: Object;
}
export interface IClickwrapLog_Mongo {
  _id: ObjectId; //-- MONGOIZED --//
  created_at: Date; //-- MONGOIZED --//
  event: "grant_consent" | "withdraw_consent";
  documents: IClickwrapDocument[];
  other: Object;
}

//-- Clickwrap User Status --//
export interface IClickwrapUserStatus {
  _id: string; //-- {MONGOIZE} ObjectId --//
  created_at: string; //-- {MONGOIZE} Date --//
  last_edited: string; //-- {MONGOIZE} Date --//
  activeAgreement: boolean;
}
export interface IClickwrapUserStatus_Mongo {
  _id: ObjectId; //-- MONGOIZED --//
  created_at: Date; //-- MONGOIZED --//
  last_edited: Date; //-- MONGOIZED --//
  activeAgreement: boolean;
}
