// TODO - fix, this script isn't working

import { Client } from "ssh2";
import fs from "fs";

const ssh_host = "18.207.101.199";
const ssh_port = 22;
const ssh_user = "ec2-user";
const ssh_pem = fs.readFileSync("./chrt-1-bastion-postgres-02.pem");
const src_host = "127.0.0.1";
const src_port = 2222;
const dst_host =
  "db-instance-chrt-user-trading-data.cmlzf31dlxgq.us-east-1.rds.amazonaws.com";
const dst_port = 5432;

function connect() {
  const conn = new Client();

  conn
    .on("ready", () => {
      console.log("SSH connection established");
      conn.forwardIn(src_host, src_port, dst_host, dst_port, (err) => {
        if (err) throw err;
        console.log("Port forwarding started");
      });
    })
    .on("error", (err) => {
      console.error(`SSH connection error: ${err}`);
      // Attempt to reconnect after a short delay
      setTimeout(() => {
        connect();
      }, 5000);
    })
    .connect({
      host: ssh_host,
      port: ssh_port,
      username: ssh_user,
      privateKey: ssh_pem,
    });
}

connect();
