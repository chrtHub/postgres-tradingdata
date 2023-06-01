import retry from "async-retry";

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
  let SecretStringJSON = {
    host: "",
    port: "",
    dbname: "",
    username: "",
    password: "",
  };

  try {
    await retry(
      async () => {
        console.log("AWS Secrets Manager - fetching rds-postgres config");
        let getSecretValueResponse = await secretsManager_client.send(
          new GetSecretValueCommand({
            SecretId:
              "/chrt/journal/prod/rds-postgres/user_app_server_read_write/credentials",
            VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
          })
        );

        //-- Parse string into JSON --//
        if (getSecretValueResponse.SecretString) {
          SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
        } else {
          throw new Error("rds-postgres SecretString is empty");
        }
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
  }

  const { host, port, dbname, username, password } = SecretStringJSON;
  return {
    rdsDB_host: host,
    rdsDB_port: port,
    rdsDB_dbname: dbname,
    rdsDB_username: username,
    rdsDB_password: password,
  };
};

//-- DocumentDB MongoDB --//
export const getDocDBDatabaseConfigFromSecretsManager = async () => {
  let SecretStringJSON = {
    host: "",
    port: "",
    dbname: "",
    username: "",
    password: "",
  };

  try {
    await retry(
      async () => {
        console.log("AWS Secrets Manager - fetching docdb-mongodb config");
        let getSecretValueResponse = await secretsManager_client.send(
          new GetSecretValueCommand({
            SecretId: "/chrt/docdb/prod/custom-app-server",
            VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
          })
        );

        //-- Parse string into JSON --//
        if (getSecretValueResponse.SecretString) {
          SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
        } else {
          throw new Error("docdb-mongodb SecretString is empty");
        }
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
  }
  const { host, port, dbname, username, password } = SecretStringJSON;
  return {
    docDB_host: host,
    docDB_port: port,
    docDB_dbname: dbname,
    docDB_username: username,
    docDB_password: password,
  };
};
