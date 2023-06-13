import { JwtHeader, JwtPayload } from "jwt-decode";
import { Request } from "express";

export {}; //-- Cause this file to be treated as a module, enabling default ES Modules import/export behavior --//

//-- Strangely, the Auth0 types for JwtPayload don't cover the properties returned within tokens, so this interface extends JwtPayload --//
interface IExtendedJwtPayload extends JwtPayload {
  azp?: string;
  scope?: string;
  permissions?: string[] | string;
  app_metadata?: {
    user_db_id?: string;
    // [key: string]: any; //-- Index-signature syntax, perhaps use in the future if more app_metadat fields added --//
  };
}

export interface IRequestWithAuth extends Request {
  auth?: {
    header?: JwtHeader; //-- Decoded Header --//
    payload?: IExtendedJwtPayload; //-- Decoded Payload --//
  };
}

//-- Example decoded JwtPayload: --//
// {
//   "iss": "https://chrt-prod.us.auth0.com/",
//   "sub": "google-oauth2|***redacted_number***",
//   "aud": [
//     "https://chrt.com",
//     "https://chrt-prod.us.auth0.com/userinfo"
//   ],
//   "iat": 1678231341,
//   "exp": 1678317741,
//   "azp": "8bDLHYeEUfPHH81VRDBsCTN5TYklAMCu",
//   "scope": "openid profile email read:journal write:journal read:data",
//   "permissions": [
//     "read:data",
//     "read:journal",
//     "write:journal"
//   ]
// }
