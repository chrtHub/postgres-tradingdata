//-- AWS client(s) --//

//-- knex client --//
import { knex } from "../index";

//-- Utility Functions --//
import getUserDbId from "../Util/getUserDbId.js";

//-- NPM Functions --//

//-- ********************* Some Controller ********************* --//
export const some_Function = async (req, res) => {
  let user_db_id = getUserDbId(req);
  let { foo } = req.params; // for route like 'some_route/:foo'

  if (!foo) {
    res.status(400).send("Missing foo param");
  }

  try {
    // let data = fetchData()
    // return res.json(data)
  } catch (e) {
    console.log(e);
    return res.status(500).send("error message while trying to beep boop");
  }
};
