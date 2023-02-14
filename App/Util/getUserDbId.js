export default function getUserDbId(req) {
  let { payload } = req.auth;
  let user_db_id = payload?.app_metatdata?.user_db_id || payload.sub;
  return user_db_id;
}
