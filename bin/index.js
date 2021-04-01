#!/usr/bin/env node

import yargs from 'yargs'
import axios from 'axios'
import fs from 'fs'

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

import { createStacksPrivateKey, makeContractCall, makeContractDeploy, bufferCVFromString, intCV, broadcastTransaction, callReadOnlyFunction } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import BN from "bn.js";

const options = yargs
 .command('generate', 'Deploy a new price feed oracle contract', {
 	"b": { alias: "base", describe: "Base ticker (e.g. BTC)", type: "string", demandOption: true },
 	"c": { alias: "convert", describe: "Convert ticker (e.g. USD)", type: "string", demandOption: true },
 	"p": { alias: "privkey", describe: "Private key that deploys the oracle contract", type: "string", demandOption: true },
 	"k": { alias: "pubkey", describe: "Public key that deploys the oracle contract", type: "string", demandOption: true },
 	"n": { alias: "network", describe: "Network: mainnet or testnet", type: "string"}
 }, argv => {})
 .usage("Generate: stxoracle generate -b BTC -c USD -p 'oracleaccountprivatekey' -k 'ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ'")

 .command('update', 'Check and update an existing price feed oracle contract', {
 	"b": { alias: "base", describe: "Base ticker (e.g. BTC)", type: "string", demandOption: true },
 	"c": { alias: "convert", describe: "Convert ticker (e.g. USD)", type: "string", demandOption: true },
 	"p": { alias: "privkey", describe: "Private key that controls oracle contract", type: "string", demandOption: true },
 	"k": { alias: "pubkey", describe: "Public key that interacts with oracle contract", type: "string", default: "ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ" },
 	"n": { alias: "network", describe: "Network: mainnet or testnet", type: "string"},
 	"ca": { alias: "contractaddress", describe: "Oracle contract address", type: "string", demandOption: true },
 	"cn": { alias: "contractname", describe: "Oracle contract name", type: "string", demandOption: true },
 	"cfu": { alias: "contractfunctionupdate", describe: "Oracle contract function for update", type: "string", default: "update-price" },
 	"cfr": { alias: "contractfunctionread", describe: "Oracle contract function for reading", type: "string", default: "get-price" },
 	"t": { alias: "threshold", describe: "Price threshold for updating price on contract", type: "string", default: 10}
 }, argv => {})
 .usage("Update: stxoracle update -b BTC -c USD -ca 'ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ' --cn oracle_btcusd -p 'oracleaccountprivatekey'")

 // .option("b", { alias: "base", describe: "Base ticker (e.g. BTC)", type: "string", demandOption: true })
 // .option("c", { alias: "convert", describe: "Convert ticker (e.g. USD)", type: "string", demandOption: true })
 // .option("ca", { alias: "contractaddress", describe: "Oracle contract address", type: "string", demandOption: true })
 // .option("cn", { alias: "contractname", describe: "Oracle contract name", type: "string", demandOption: true })
 // .option("cfu", { alias: "contractfunctionupdate", describe: "Oracle contract function for update", type: "string" })
 // .option("cfr", { alias: "contractfunctionread", describe: "Oracle contract function for reading", type: "string" })
 // .option("t", { alias: "threshold", describe: "Price threshold for updating price on contract", type: "string"})
 // .option("p", { alias: "privkey", describe: "Private key that controls oracle contract", type: "string", demandOption: true })
 // .option("k", { alias: "pubkey", describe: "Public key that interacts with oracle contract", type: "string" })
 // // .option("m", { alias: "mnemonic", describe: "Mnemonic 24-word seed that controls oracle contract", type: "string", demandOption: true })
 // .option("n", { alias: "network", describe: "Network: mainnet or testnet", type: "string"})

 .default({n : "testnet"})
 .argv;

var network = new StacksTestnet();
if (options.network != "testnet"){
	network = new StacksMainnet();	
}

if(options._[0] == "update") {
	// pull data
	// https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD 
	var url = "https://min-api.cryptocompare.com/data/price?fsym="+ options.base +"&tsyms="+ options.convert 
	axios.get(url, { headers: { Accept: "application/json" } })
	 .then(res => {
	   // parse response
	   var newfxprice = parseInt(res.data[options.convert]);
	   console.log("newfxprice: ", newfxprice);

		// check contract to see if diff > threshold
		const contractAddress = options.contractaddress;
		const contractName = options.contractname;
		const functionName = options.contractfunctionread;
		// const buffer = bufferCVFromString('foo');
		const senderAddress = options.pubkey;
		const readoptions = {
		  contractAddress,
		  contractName,
		  functionName,
		  functionArgs: [],
		  network,
		  senderAddress,
		};
		// console.log("read options: ", readoptions);
		// var result = readcontract(readoptions);
		// console.log("read result: ", result);

		callReadOnlyFunction(readoptions).then(result => {
			console.log("oracleprice: ", result.value.value.toString());
			var oracleprice = parseInt(result.value.value.toNumber());

			if( Math.abs(oracleprice - newfxprice) >= options.threshold){
			   	//update price on oracle contract
			   	console.log("need to update price on oracle contract: ", Math.abs(oracleprice - newfxprice) , "is greater than or equal to", options.threshold);

				const txOptions = {
					contractAddress: options.contractaddress,
					contractName: options.contractname,
					functionName: options.contractfunctionupdate,
					functionArgs: [intCV(newfxprice)],
					senderKey: options.privkey,
					validateWithAbi: true,
					network,
					// postConditions,
				};
				// console.log("txOptions: ", txOptions);
				makeContractCall(txOptions).then(ccresult => {
					// console.log("ccresult: ", ccresult);
					broadcastTransaction(ccresult, network).then(txresult => {
						console.log("txresult: ", txresult);
					}).catch(txerr => {
						console.log("txerr: ", txerr);
					})
				}).catch(error => {
					console.log("makeContractCall error: ", error);
				});	
			} else {
				console.log("value within threshold. no need for an update.");
			}		

		}).catch(error => {
			console.log("callReadOnlyFunction error: ", error);
		});


	 }).catch(error => {
	 	console.log("error: ", error);
	 });
}


if(options._[0] == "generate") {
	var contractname = "oracle_"+options.base.toLowerCase()+options.convert.toLowerCase();
	var contractstr = fs.readFileSync(__dirname + '/../priceoracle.clar').toString();
	var updatedcontract = contractstr.replace(/ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ/g, options.pubkey);

	const txOptions = {
	  contractName: contractname,
	  codeBody: updatedcontract,
	  senderKey: options.privkey,
	  network,
	};
	// console.log("txOptions: ", txOptions);

	makeContractDeploy(txOptions).then(transaction => {
		// console.log("transaction: ", transaction);
		broadcastTransaction(transaction, network).then(txresult => {
			console.log("txresult: ", txresult);
		}).catch(txerr => {
			console.log("txerr: ", txerr);
		});
	}).catch(deployerr => {
		console.log("deployerr: ",deployerr);
	})
	
}


