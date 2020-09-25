const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

async function getCurrentAccount() {
  const currentAccounts = await web3.eth.getAccounts();
  return currentAccounts[0];
}

async function requestFromFaucet() {

}

async function handleRequest() {

}

handleRequest()