//-- knex client --//
import { knex } from "../../index.js";

//-- Fetch Data --//
export const fetchData = async (req, res) => {
  try {
    let rows = { foo: "bar" };
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error fetching data" });
  }
};

// export const someHandler = async (req, res) => {};
