import dayjs from "dayjs";
import cors from "cors";
import express from "express";
import AWS from "aws-sdk";
import dotenv from "dotenv";
// import { handleRequest } from "./faucet";

dotenv.config();

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
});

const docClient = new AWS.DynamoDB.DocumentClient();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/", (req, res) => {
  var queryParams = {
    TableName: "aragon-skylark-faucet-db",
    KeyConditionExpression: "address = :a",
    ExpressionAttributeValues: {
      ":a": req.body.address,
    },
  };

  docClient.query(queryParams, function (err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      res
        .status(503)
        .send(JSON.stringify("There was an error connecting to the database"));
    } else {
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
          // handleRequest(req.body.address, 5);
          var putParams = {
            TableName: "aragon-skylark-faucet-db",
            Item: {
              address: req.body.address,
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
                  JSON.stringify(`Successfully sent to ${req.body.address}`)
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
