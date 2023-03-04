//-- knex client --//
import { knex } from "../../index.ts";
import getUserDbId from "../utils/getUserDbId.js";

//-- Fetch Data --//
export const fetchData = async (req, res) => {
  let user_db_id = getUserDbId(req);

  try {
    let rows = { foo: "bar", user_db_id: user_db_id };
    res.json(rows);
  } catch (e) {
    console.log(e);
    res.status(500).send("Error fetching data");
  }
};

// export const someHandler = async (req, res) => {};
