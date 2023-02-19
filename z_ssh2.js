import { Client as SSH_Client } from "ssh2"; //-- Dev mode, ssh tunnel to RDS instance --//

//-- SSH tunnel config values --//
// let src_host = "127.0.0.1";
// let src_port = 22;
// let ec2_username = "ec2-user";
// let ec2_host = "18.207.101.199"; //-- Subject to change --//
// let ec2_pemFile = fs.readFileSync("./chrt-1-bastion-postgres-02.pem"); //-- Local file --//

//-- In development mode, connect to db via SSH tunnel --//
// if (process.env.NODE_ENV === "development") {
// console.log("To use SSH tunnell...");
//
//   const setupSSHTunnel = async () => {
//     return new Promise((resolve, reject) => {
//       //-- Establish ssh tunnel via EC2 bastion host to RDS --//
//       const ssh_conn = new SSH_Client();
//       ssh_conn.connect({
//         host: ec2_host,
//         username: ec2_username,
//         privateKey: ec2_pemFile,
//       });

//       ssh_conn.on("banner", () => {
//         console.log("banner");
//       });

//       //-- On ready, create forwarding --//
//       ssh_conn.on("ready", () => {
//         console.log("ssh connection :: ready");
//         ssh_conn.forwardOut(
//           src_host,
//           src_port,
//           db_host,
//           db_port,
//           (err, stream) => {
//             if (err) {
//               console.log("ssh_conn.forwardOut() err: " + err);
//               reject(err);
//             } else {
//               //-- Override db_host to point to local ssh tunnel, not directly to RDS --//
//               db_host = src_host;
//               db_port = src_port;

//               console.log("SSH tunnel (forwardOut) ready");
//               resolve();
//             }
//           }
//         );
//       });
//     });
//   };

//   await setupSSHTunnel();
// }
