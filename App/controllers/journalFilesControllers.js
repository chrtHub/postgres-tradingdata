//-- user_db_id utility function --//
import getUserDbId from "../Util/getUserDbId.js";

//-- knex client --//

//-- AWS client(s) --//

//-- ********************* List Files ********************* --//
export const listFiles = async (req, res) => {
  let user_db_id = getUserDbId(req);

  try {
    // TODO
    console.log("TODO - get files list for: " + user_db_id);
  } catch (err) {
    console.log(err);
  }
  res.send("TODO - get files list for: " + user_db_id);
};
