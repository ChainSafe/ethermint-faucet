const dayjs = require("dayjs");
const cors = require("cors");
const express = require("express");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const node0 = {
  daddr: process.env.ETHERMINT_NODE_ADDR,
  laddr: process.env.ETHERMINT_RPC_ADDR,
  key: process.env.ETHERMINT_KEY_NAME,
};

const docClient = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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
  exec(
    `ethermintcli tx faucet request ${process.env.FAUCET_REQUEST_AMOUNT}aphoton --from ${node0.key} --chain-id ${process.env.CHAIN_ID} --fees 2photon --node ${daddr} --yes`,
    function (error, stdout, stderr) {
      console.log("stdout:\n" + stdout);
      if (error !== null) {
        console.log("stderr:\n" + stderr);
        console.log("exec error: " + error);
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
      `Balance ${balance} less than requested amount ${amount}, making faucet request`
    );
    await requestFromFaucet();
  }

  let retries = 0;
  while (balance < amount) {
    balance = await web3.eth.getBalance(from);
    sleep(100);
    retries++;
    if (retries == maxRetries) {
      console.log("unable to make faucet request");
      return Promise.reject("The Faucet is broke. Try again later");
    }
  }

  if (
    process.env.ETHERMINT_PRIVATE_KEY == "0x" ||
    process.env.ETHERMINT_PRIVATE_KEY == undefined
  ) {
    console.error(
      "No private key set. Please make sure a valid private key is used for the faucet"
    );
    return Promise.reject(
      "Invalid faucet setup. Please contact the maintainer of the faucet for help."
    );
  }

  console.log("making transfer");
  let signedTx = await web3.eth.accounts.signTransaction(
    {
      to: to,
      from: from,
      value: amount,
      gasPrice: 1,
      gasLimit: 22000,
    },
    process.env.ETHERMINT_PRIVATE_KEY
  );
  console.log("signed tx");

  let receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  console.log("sent transfer!", receipt);
  return Promise.resolve();
}

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/", (req, res) => {
  const addressRequesting = req.body.address;
  const isAddress = Web3.utils.isAddress(addressRequesting);

  if (!isAddress) {
    res.status(400).send(JSON.stringify("This is not an ETH Address"));
  }

  var queryParams = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    KeyConditionExpression: "address = :a",
    ExpressionAttributeValues: {
      ":a": addressRequesting,
    },
  };

  docClient.query(queryParams, async function (err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      res
        .status(503)
        .send(JSON.stringify("There was an error connecting to the database"));
    } else {
      console.log("Successfully queried db");
      if (data.Items.length > 0) {
        console.log("Faucet rate limit exceeded for this user");
        res
          .status(429)
          .send(
            JSON.stringify(
              `You can request funds from this faucet every ${process.env.COOLDOWN_TIME} hours. Please try again later.`
            )
          );
      } else {
        console.log("no previous faucet payments made. executing");
        try {
          await handleRequest(addressRequesting, process.env.FAUCET_AMOUNT);
          var putParams = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: {
              address: addressRequesting,
              expiration: dayjs().add(process.env.COOLDOWN_TIME, "hour").unix(),
            },
          };
          console.log("faucet payment was successful. saving to db");
          docClient.put(putParams, function (err, data) {
            if (err) {
              console.error(
                "Unable to add item. Error JSON:",
                JSON.stringify(err, null, 2)
              );
            } else {
              console.log("Faucet entry added:", JSON.stringify(data, null, 2));
            }
          });
          res
            .status(200)
            .send(JSON.stringify(`Successfully sent to ${addressRequesting}`));
        } catch (error) {
          res
            .status(503)
            .send(
              JSON.stringify("There was an error. Please try again later.")
            );
        }
      }
    }
  });
});

app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`)
);
