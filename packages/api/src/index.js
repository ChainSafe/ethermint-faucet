var dayjs = require("dayjs");
var cors = require("cors");
var express = require("express");
var AWS = require("aws-sdk");
var dotenv = require("dotenv");
// import { handleRequest } from "./faucet";

dotenv.config({ path: "./.env" });
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// const dynamoDb = new AWS.DynamoDB({
//   region: "us-east-1",
//   endpoint: "http://localhost:3001",
// });

const docClient = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
});

// var createParams = {
//   TableName: "aragon-skylark-faucet-db",
//   KeySchema: [
//     { AttributeName: "address", KeyType: "HASH" },
//     { AttributeName: "expiration", KeyType: "RANGE" },
//   ],
//   AttributeDefinitions: [
//     { AttributeName: "address", AttributeType: "S" },
//     { AttributeName: "expiration", AttributeType: "N" },
//   ],
//   ProvisionedThroughput: {
//     ReadCapacityUnits: 5,
//     WriteCapacityUnits: 5,
//   },
// };

// dynamoDb.createTable(createParams, function (err, data) {
//   if (err) {
//     console.log(
//       "Unable to create table: " + "\n" + JSON.stringify(err, undefined, 2)
//     );
//   } else {
//     console.log("Created table: " + "\n" + JSON.stringify(data, undefined, 2));
//   }
// });

const node0 = {
  laddr: "http://54.210.246.165:8545",
  key: "node0",
};

const maxRetries = 10;

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(node0.laddr));
var exec = require("child_process").exec;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCurrentAccount() {
  const currentAccounts = await web3.eth.getAccounts();
  return currentAccounts[0];
}

async function requestFromFaucet() {
  let cmd = exec(
    `aragonchaincli tx faucet request 100000000000000ara --from ${node0.key} --chain-id aragonchain-2 --fees 2ara --yes`,
    function (error, stdout, stderr) {
      console.log("stdout:\n" + stdout);
      if (error !== null) {
        console.log("stderr:\n" + stderr);
        console.log("exec error: " + error);
        // process.exit(1);
      }
    }
  );
}

async function handleRequest(to, amount) {
  let from = await getCurrentAccount();
  let balance = await web3.eth.getBalance(from);
  console.log("balance: ", balance);
  if (parseInt(balance, 10) <= amount) {
    console.log(
      `balance ${balance} less than requested amount ${amount}, making faucet request`
    );
    await requestFromFaucet();
  }

  let retries = 0;
  while (balance < amount) {
    balance = await web3.eth.getBalance(from);
    sleep(100);
    retries++;
    if (retries == maxRetries) {
      console.log("unable to make faucet request, please request lower amount");
      // process.exit(2);
    }
  }

  console.log("making transfer");

  let receipt = await web3.eth.sendTransaction({
    to: to,
    from: from,
    value: amount,
    gasPrice: 1,
    gasLimit: 22000,
  });
  console.log("sent transfer!", receipt);
}

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
          // TODO Confirm the amount here
          handleRequest(addressRequesting, 5);
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
