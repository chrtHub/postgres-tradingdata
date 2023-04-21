# WORKED ON APRIL 20, 2023
mongosh --tls --host localhost:22222 --tlsCAFile PUBLIC-rds-ca-bundle.pem --tlsAllowInvalidHostnames --retryWrites=false --username chrtDocDB --password PASSWORD

# WORKED ON APRIL 20, 2023
mongosh --tls --host localhost:22222 --tlsCAFile PUBLIC-rds-ca-bundle.pem --tlsAllowInvalidHostnames --retryWrites=false --username dev-aaron --password PASSWORD

# WORKED ON APRIL 20, 2023
mongosh --tls --host localhost:22222 --tlsCAFile PUBLIC-rds-ca-bundle.pem --tlsAllowInvalidHostnames --retryWrites=false --username custom-app-server --password PASSWORD

# DEV - to remove 'retryWrites=false'??

# --tlsAllowInvalidHostnames used to allow localhost:22222 when using SSH tunnel through bastion server with port forwarding to the DocumentDB instance
# https://www.mongodb.com/docs/mongodb-shell/reference/options/#std-option-mongosh.--tlsAllowInvalidHostnames
