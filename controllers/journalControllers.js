//-- pg client --//
import { pgClient } from "../index.js";

//-- Fetch Sales --//
export const fetchSales = async (req, res) => {
  try {
    const db_response = await pgClient.query("SELECT * FROM sales LIMIT 10;");
    res.json(db_response.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error fetching data" });
  }
};
