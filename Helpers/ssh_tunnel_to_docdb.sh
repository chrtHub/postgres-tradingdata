##-- protect pem file --##
chmod 400 chrt-1-bastion-postgres-02.pem
##-- check that permission is now read-only --##
ls -l

##-- Variables --##
# Chosen local port - 22222
# RDS instance - chrt-docdb.cmlzf31dlxgq.us-east-1.docdb.amazonaws.com
# MongoDB port - 27017
# User - ec2-user
# EC2 Bastion instance public IPv4 (as of 2022-12-25) - 18.207.101.199

##-- SSH tunnel from localhost --> EC2 --> RDS --##
ssh -i "chrt-1-bastion-postgres-02.pem" -N -L 22222:chrt-docdb.cmlzf31dlxgq.us-east-1.docdb.amazonaws.com:27017 ec2-user@18.207.101.199 -vv

##-- Check if tunnel is established on port 2222 --##
netstat -ntaP tcp | grep -i LISTEN | grep 22222