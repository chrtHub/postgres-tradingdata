# protect pem file
chmod 400 chrt-1-bastion-postgres-02.pem
# check that permission is now read-only
ls -l

# Chosen local port
# 2222

# RDS instance
# db-instance-chrt-user-trading-data.cmlzf31dlxgq.us-east-1.rds.amazonaws.com

# PostgreSQL port
# 5432

# User
# "ec2-user"

# EC2 Bastion instance public IPv4
# 44.211.243.36

# command to make tunnel
ssh -i "chrt-1-bastion-postgres-02.pem" -NL 2222:db-instance-chrt-user-trading-data.cmlzf31dlxgq.us-east-1.rds.amazonaws.com:5432 ec2-user@18.207.101.199

# `-i` indicates identity file used to create SSH connection
# `-NL` specifies that connection should be a port forwarding tunnel
# # the `N` tells SSH not to execute a command on the remote host
# # the `L` specifies that traffic should be forwarded from the local host to the remote host
# `-v` (optional) increases verbosity of the SSH command output, will print SSH log in terminal 

# thus, create an SSH tunnel forwarding traffic from localhost on port 2222 ---> remote host db-instance-chrt-user-trading-data.cmlzf31dlxgq.us-east-1.rds.amazonaws.com on port 5432

# check if tunnel is established on port 2222
netstat -ntaP tcp | grep -i LISTEN | grep 2222

##### ##### ##### ##### ##### ##### ##### ##### ##### #####

## SSH to instance
ssh -i "chrt-1-bastion-postgres-02.pem" ec2-user@18.207.101.199

# get public key information for private key
ssh-keygen -y -f my-key-pair-file.pemc
# example output
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCzeC+K+qmbCDPAPhqMv9ictGI+P4lc028UrtF6QpbD5dVYwt814UVk/I9FSMjrF66waRZcftP88q5PJFQaiFr61ZNGtwPH4kH3TGhrf7GynvBXRRFBGlivhs6WTBS3rIQfTkvuZnwIjN7f+1F9bhOeOrqKAwp07U8ys9EokJBVeWZc+q1b4Yre715beO+Tz2KjV7+ruPwUInVAEehzJWNzEYgiA2hW8I8Ugq7FPgTpb2zXbbAYkmM5j0AHWv58Xio3Wld07IoL8aVznIn7oEfm0MfvOBAtWhe5i7Vi/jbrC0FoJFrWw9PnBLCBroGf8OA7MWYRXfYNDjK5cOsi+CiR

# view ssh public key identifier
cat .ssh/authorized_keys

# overwrite public key identifier in .ssh/authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCzeC+K+qmbCDPAPhqMv9ictGI+P4lc028UrtF6QpbD5dVYwt814UVk/I9FSMjrF66waRZcftP88q5PJFQaiFr61ZNGtwPH4kH3TGhrf7GynvBXRRFBGlivhs6WTBS3rIQfTkvuZnwIjN7f+1F9bhOeOrqKAwp07U8ys9EokJBVeWZc+q1b4Yre715beO+Tz2KjV7+ruPwUInVAEehzJWNzEYgiA2hW8I8Ugq7FPgTpb2zXbbAYkmM5j0AHWv58Xio3Wld07IoL8aVznIn7oEfm0MfvOBAtWhe5i7Vi/jbrC0FoJFrWw9PnBLCBroGf8OA7MWYRXfYNDjK5cOsi+CiR" > .ssh/authorized_keys

# view ssh public key identifier
cat .ssh/authorized_keys