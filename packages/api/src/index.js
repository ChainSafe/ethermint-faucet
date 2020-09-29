import dayjs from "dayjs";
import cors from "cors";
import express from "express";
import AWS from "aws-sdk";
import dotenv from "dotenv";
// import { handleRequest } from "./faucet";

dotenv.config();

AWS.config.update({
  region: "localhost",
  endpoint: "http://localhost:3001",
  // accessKeyId default can be used while using the downloadable version of DynamoDB.
  // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
  accessKeyId: "fakeMyKeyId",
  // secretAccessKey default can be used while using the downloadable version of DynamoDB.
  // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
  secretAccessKey: "fakeSecretAccessKey",
});

const dynamoDb = new AWS.DynamoDB({
  region: "localhost",
  endpoint: "http://localhost:3001",
});

const docClient = new AWS.DynamoDB.DocumentClient({
  region: "localhost",
  endpoint: "http://localhost:3001",
});

var createParams = {
  TableName: "aragon-skylark-faucet-db",
  KeySchema: [
    { AttributeName: "address", KeyType: "HASH" },
    { AttributeName: "expiration", KeyType: "RANGE" },
  ],
  AttributeDefinitions: [
    { AttributeName: "address", AttributeType: "S" },
    { AttributeName: "expiration", AttributeType: "N" },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

dynamoDb.createTable(createParams, function (err, data) {
  if (err) {
    console.log(
      "Unable to create table: " + "\n" + JSON.stringify(err, undefined, 2)
    );
  } else {
    console.log("Created table: " + "\n" + JSON.stringify(data, undefined, 2));
  }
});

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/", (req, res) => {
  const addressRequesting = req.body.address;
  var queryParams = {
    TableName: "aragon-skylark-faucet-db",
    KeyConditionExpression: "address = :a",
    ExpressionAttributeValues: {
      ":a": addressRequesting,
    },
  };

  docClient.query(queryParams, function (err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      res
        .status(503)
        .send(JSON.stringify("There was an error connecting to the database"));
    } else {
      console.log(data.Items);
      if (data.Items.length > 0) {
        res
          .status(429)
          .send(
            JSON.stringify(
              "'You can request funds from this faucet every 24 hours. Please try again later.'"
            )
          );
      } else {
        try {
          // handleRequest(addressRequesting, 5);
          var putParams = {
            TableName: "aragon-skylark-faucet-db",
            Item: {
              address: addressRequesting,
              expiration: dayjs().add(1, "day").unix(),
            },
          };

          docClient.put(putParams, function (err, data) {
            if (err) {
              console.error(
                "Unable to add item. Error JSON:",
                JSON.stringify(err, null, 2)
              );
            } else {
              console.log("Added item:", JSON.stringify(data, null, 2));
              res
                .status(200)
                .send(
                  JSON.stringify(`Successfully sent to ${addressRequesting}`)
                );
            }
          });
        } catch (error) {
          res
            .status(503)
            .send(
              JSON.stringify("There was an error connecting to the database")
            );
        }
      }
    }
  });
});

app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`)
);
