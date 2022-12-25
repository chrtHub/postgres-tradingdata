# Can you write an AWS CLI command to change the target group of an ECS service?

aws ecs update-service --cluster node-postgres --service node-postgres-2 --target-group-arn arn:aws:elasticloadbalancing:us-east-1:897621100871:targetgroup/node-postgres-8080/b114a6c4e2ff783f
