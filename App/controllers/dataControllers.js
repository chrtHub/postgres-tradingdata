//-- knex client --//
import { knex } from "../../index.js";
import getUserDbId from "../Util/getUserDbId.js";

//-- Fetch Data --//
export const fetchData = async (req, res) => {
  let user_db_id = getUserDbId(req);

  try {
    let rows = { foo: "bar", user_db_id: user_db_id };
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error fetching data" });
  }
};

// export const someHandler = async (req, res) => {};
