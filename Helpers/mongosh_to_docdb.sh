# WORKED ON APRIL 15, 2023
mongosh --tls --host localhost:22222 --tlsCAFile rds-combined-ca-bundle.pem --tlsAllowInvalidHostnames --username chrtDocDB --password PASSWORD

# --tlsAllowInvalidHostnames used to allow localhost:22222 when using SSH tunnel through bastion server with port forwarding to the DocumentDB instance
# https://www.mongodb.com/docs/mongodb-shell/reference/options/#std-option-mongosh.--tlsAllowInvalidHostnames
