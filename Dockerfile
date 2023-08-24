FROM --platform=linux/amd64 node:16
WORKDIR /app
COPY package*.json ./
COPY ./PUBLIC-rds-ca-bundle.pem /app/PUBLIC-rds-ca-bundle.pem
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
