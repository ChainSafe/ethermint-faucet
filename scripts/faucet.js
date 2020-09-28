const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var exec = require('child_process').exec, child;

async function getCurrentAccount() {
  const currentAccounts = await web3.eth.getAccounts();
  return currentAccounts[0];
}

async function requestFromFaucet() {
	let cmd = exec("aragonchaincli tx faucet request 1000000000000000ara --from mykey --chain-id aragonchain-1123698127639817236 --fees 2ara --yes",
		function (error, stdout, stderr) {
	        console.log('stdout: ' + stdout);
	        console.log('stderr: ' + stderr);
	        if (error !== null) {
	             console.log('exec error: ' + error);
	             exit(1)
	        }
	    })
	//cmd()
}

async function handleRequest(to, amount) {
	let from = await getCurrentAccount();
	let balance = await web3.eth.getBalance(from);
	console.log("balance: ", balance)
	if (balance <= amount) {
		await requestFromFaucet()
	}
	while (balance < amount) {
		balance = await web3.eth.getBalance(from)
	}
	console.log("making transfer")

	let receipt = await web3.eth.sendTransaction({to: to, from: from, value: amount, gasPrice: 1, gasLimit: 22000})
	console.log("sent transfer!", receipt)
}

handleRequest("0x786b82b6454c6e1a085f3ca31ff9f82d5469bfcc", 100)