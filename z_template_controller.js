//-- AWS client(s) --//

//-- knex client --//
import { knex } from "../../index.js";

//-- Utility Functions --//
import getUserDbId from "../Util/getUserDbId.js";

//-- NPM Functions --//

//-- ********************* Some Controller ********************* --//
import getUserDbId from "../Util/getUserDbId.js";

export const some_Function = async (req, res) => {
  let user_db_id = getUserDbId(req);
  let { foo } = req.params; // for route like 'some_route/:foo'

  try {
    // TODO
  } catch (err) {
    res.status(500).json({ error: "Error <<>>" });
  }
};
