//-- Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});

//-- RDS PostgreSQL --//
export const getRDSDatabaseConfigFromSecretsManager = async () => {
  let rdsDB_host, rdsDB_port, rdsDB_dbname, rdsDB_username, rdsDB_password;

  try {
    console.log("AWS Secrets Manager - fetching rds-postgres config");
    let getSecretValueResponse = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId:
          "/chrt/journal/prod/rds-postgres/user_app_server_read_write/credentials",
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );

    //-- Parse string into JSON, store values into variables --//
    if (getSecretValueResponse.SecretString) {
      let SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
      rdsDB_host = SecretStringJSON.host;
      rdsDB_port = SecretStringJSON.port;
      rdsDB_dbname = SecretStringJSON.dbname;
      rdsDB_username = SecretStringJSON.username;
      rdsDB_password = SecretStringJSON.password;
    } else {
      throw new Error("rds-postgres SecretString is empty");
    }
  } catch (err) {
    console.log(err);
  }
  return {
    rdsDB_host,
    rdsDB_port,
    rdsDB_dbname,
    rdsDB_username,
    rdsDB_password,
  };
};

//-- DocumentDB MongoDB --//
export const getDocDBDatabaseConfigFromSecretsManager = async () => {
  let docDB_host, docDB_port, docDB_dbname, docDB_username, docDB_password;

  try {
    console.log("AWS Secrets Manager - fetching docdb-mongodb config");
    let getSecretValueResponse = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId: "/chrt/docdb/prod/custom-app-server",
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );

    //-- Parse string into JSON, store values into variables --//
    if (getSecretValueResponse.SecretString) {
      let SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
      docDB_host = SecretStringJSON.host;
      docDB_port = SecretStringJSON.port;
      docDB_dbname = SecretStringJSON.dbname || "";
      docDB_username = SecretStringJSON.username;
      docDB_password = SecretStringJSON.password;
    } else {
      throw new Error("docdb-mongodb SecretString is empty");
    }
  } catch (err) {
    console.log(err);
  }
  return {
    docDB_host,
    docDB_port,
    docDB_dbname,
    docDB_username,
    docDB_password,
  };
};
