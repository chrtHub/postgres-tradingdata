# Update the service to use a load balancer and specify the security group
aws ecs update-service \
  --cluster express-postgres-trading-data \
  --service chrt-express-postgres-tradingdata \
  --network-configuration "{\"awsvpcConfiguration\":{\"subnets\":[\"subnet-00bf85c31a715818e \", \"subnet-0415722cda5c7d17a\", \"subnet-07ac50b53e6065bbb\", \"subnet-0b242353b0ed8b1c4\", \"subnet-036c2a24fd69f18ac\", \"subnet-0b4cfdbec6944b096\"],\"securityGroups\":[\"sg-017205517db26329e\"],\"assignPublicIp\":\"ENABLED\"}}"
  