//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/docsControllers.js";

const app = express();

//-- Express router --//
const router = express.Router();

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
export const __dirname = dirname(fileURLToPath(import.meta.url));

//-- Routes --//

app.use(
  "/",
  express.static(path.join(__dirname, "/docs-vite/dist/index.html"))
);

// router.get('/', )

//-- Export --//
export default router;
