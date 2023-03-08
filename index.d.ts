import { JwtHeader, JwtPayload } from "jwt-decode";
import { Request } from "express";

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
