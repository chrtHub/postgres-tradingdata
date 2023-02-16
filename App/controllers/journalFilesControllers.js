//-- AWS client(s) --//
import { S3Client } from "@aws-sdk/client-s3";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

//-- knex client --//

//-- Utility Functions --//
import getUserDbId from "../Util/getUserDbId.js";

//-- NPM Functions --//
import { format } from "date-fns";

const s3_client = new S3Client({
  region: "us-east-1",
});

//-- ********************* List Files ********************* --//
export const listFiles = async (req, res) => {
  let user_db_id = getUserDbId(req);

  try {
    let response = await s3_client.send(
      new ListObjectsV2Command({
        Bucket: "chrt-user-trading-data-files",
        Prefix: `${user_db_id}`,
      })
    );

    //-- Build files list array --//
    let filesList = [];
    response.Contents.forEach((x) => {
      let brokerage = x.Key.split("/").slice(1, 2)[0] || ""; //-- penultimate item or "" --//
      let filename = x.Key.split("/").slice(2, 3)[0] || ""; //-- last item or "" --//

      //-- Only include filename and brokerage that aren't "" (those are for the S3 "folders") --//
      if (filename.length > 0 && brokerage.length > 0) {
        let file = {
          id: x.Key,
          filename: filename,
          brokerage: brokerage,
          last_modified: format(x.LastModified, "yyyy-MM-dd @ hh:mm:ss aaa"), //-- sortable format --//
          size_mb: (x.Size / 1000000).toFixed(1), //-- display with 1 decimal place --//
        };

        filesList.push(file);
      }
    });

    res.send(filesList);
  } catch (err) {
    console.log(err);
  }
};

//-- ********************* Get File ********************* --//
export const getFile = async (req, res) => {
  let user_db_id = getUserDbId(req);
  let { brokerage, filename } = req.params;

  let bucket = "chrt-user-trading-data-files";
  let key = `${user_db_id}/${brokerage}/${filename}`;

  try {
    let response = await s3_client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    //-- Set headers --//
    console.log(response.ContentType);
    res.setHeader("Content-Type", response.ContentType);
    res.setHeader("Content-Disposition", `attachement; filename="${filename}"`);
    //-- Pipe s3 client response into res to user --//
    response.Body.pipe(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error downloading file from S3" });
  }
};
