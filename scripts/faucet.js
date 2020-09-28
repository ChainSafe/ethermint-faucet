const node0 = {
	laddr: "http://54.210.246.165:8545",
	key: "node0"
}

const maxRetries = 10

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(node0.laddr));
var exec = require('child_process').exec, child;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCurrentAccount() {
  const currentAccounts = await web3.eth.getAccounts();
  return currentAccounts[0];
}

async function requestFromFaucet() {
	let cmd = exec(`aragonchaincli tx faucet request 100000000000000ara --from ${node0.key} --chain-id aragonchain-2 --fees 2ara --yes`,
		function (error, stdout, stderr) {
	        console.log('stdout:\n' + stdout);
	        if (error !== null) {
	        	console.log('stderr:\n' + stderr);
	            console.log('exec error: ' + error);
	            process.exit(1)
	        }
	    })
}

async function handleRequest(to, amount) {
	let from = await getCurrentAccount();
	let balance = await web3.eth.getBalance(from);
	console.log("balance: ", balance)
	if (parseInt(balance, 10) <= amount) {
		console.log(`balance ${balance} less than requested amount ${amount}, making faucet request`)
		await requestFromFaucet()
	}

	let retries = 0
	while (balance < amount) {
		balance = await web3.eth.getBalance(from)
		sleep(100)
		retries++
		if (retries == maxRetries) {
			console.log("unable to make faucet request, please request lower amount")
			process.exit(2)
		}
	}

	console.log("making transfer")

	let receipt = await web3.eth.sendTransaction({to: to, from: from, value: amount, gasPrice: 1, gasLimit: 22000})
	console.log("sent transfer!", receipt)
}

module.exports = { handleRequest }