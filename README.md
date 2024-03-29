# :file_folder: Express Server repo

- This repo is for a server that was available at [alb.chrt.com](https://alb.chrt.com)

### Dev Setup

- Terminal 1 - `npm run ssh`
- Terminal 2 - `npm run dev`

### Dev Links

- [GitHub Repo](https://github.com/chrtHub/postgres-tradingdata) - _(current page)_
- [CodePipeline](https://us-east-1.console.aws.amazon.com/codesuite/codepipeline/pipelines/chrt-express-postgres-tradingdata/view?region=us-east-1)
  - [IAM - CodeBuild service role](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-east-1#/roles/details/codebuild-chrt-express-postgres-tradingdata-service-role?section=permissions)
- [ECS Task Definitions](https://us-east-1.console.aws.amazon.com/ecs/v2/task-definitions/express-postgres?region=us-east-1)
  - [IAM - ECS task role](https://us-east-1.console.aws.amazon.com/iamv2/home#/roles/details/task-role-chrt-express-postgres-tradingdata?section=permissions)
- [ECS Cluster (Services, Tasks, etc.)](https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/node-postgres/services?region=us-east-1)

### Contact

- Need support? support@chrt.com
- Want to chat? aaron@chrt.com

# :bar_chart: [chrt.com](https://chrt.com) repos & stack

### Repos

- Front-end
  - **[React SPA](https://github.com/chrtHub/chrt-vite/)** - _(current page)_
- Back-end
  - **[Express Server](https://github.com/chrtHub/postgres-tradingdata)**
- Lambda functions
  - **[Lambda for S3 to Postgres parsing](https://github.com/chrtHub/lambda-chrtUserTradingData-S3-to-RDS-PostgreSQL)**

### Front-end Stack

- [Vite](https://vitejs.dev/) - build tooling
- [React 18](https://reactjs.org/)
- [React Router 6](https://reactrouter.com/en/main)
- [Tailwind CSS](https://tailwindcss.com/)
- [Headless UI](https://headlessui.com/)
- [S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) - for static hosting of SPA
- [CloudFront CDN](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

### Auth Stack

- [Auth0](https://auth0.com/)

### Back-end Serverful Stack

- [Postgres](https://www.postgresql.org/) on [AWS RDS (Relational Database Service)](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
- [DocumentDB 5.0 (MongoDB Compatible)](https://docs.aws.amazon.com/documentdb/latest/developerguide/what-is.html)
- [AWS Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [AWS ECS (Elastic Container Service)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) - similar to Kubernetes
- [Express](https://expressjs.com/)
- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)
- [Amazon Linux 2](https://aws.amazon.com/amazon-linux-2/)
- [AWS VPC, Target Groups, ENIs, Security Groups, etc.](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [AWS Identity and Access Management (IAM)](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)

### Back-end Serverless Stack

- [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) - serverless functions
- [S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) - for storing user-uploaded files
- [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html) - NoSQL database

### CI/CD Stack

- [GitHub](https://github.com)
- [CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
- [CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)
- [CodeDeploy](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html)

### Auth Stack

- [Auth0](https://auth0.com/)
