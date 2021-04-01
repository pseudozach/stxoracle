#!/usr/bin/env node

import yargs from 'yargs'
import axios from 'axios';

import { createStacksPrivateKey, makeContractCall, bufferCVFromString, intCV, broadcastTransaction, callReadOnlyFunction } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import BN from "bn.js";

const options = yargs
 // .usage("Usage: -b <base ticker symbol> -c <convert ticker symbol> -t <threshold to update price on contract>")
 .option("b", { alias: "base", describe: "Base ticker (e.g. BTC)", type: "string", demandOption: true })
 .option("c", { alias: "convert", describe: "Convert ticker (e.g. USD)", type: "string", demandOption: true })
 .option("ca", { alias: "contractaddress", describe: "Oracle contract address", type: "string", demandOption: true })
 .option("cn", { alias: "contractname", describe: "Oracle contract name", type: "string", demandOption: true })
 .option("cfu", { alias: "contractfunctionupdate", describe: "Oracle contract function for update", type: "string", demandOption: true })
 .option("cfr", { alias: "contractfunctionread", describe: "Oracle contract function for reading", type: "string", demandOption: true })
 .option("t", { alias: "threshold", describe: "Price threshold for updating price on contract", type: "string"})
 .option("p", { alias: "privkey", describe: "Private key that controls oracle contract", type: "string", demandOption: true })
 .option("k", { alias: "pubkey", describe: "Public key that interacts with oracle contract", type: "string", demandOption: true })
 // .option("m", { alias: "mnemonic", describe: "Mnemonic 24-word seed that controls oracle contract", type: "string", demandOption: true })
 .option("n", { alias: "network", describe: "Network: mainnet or testnet", type: "string"})
 .default({ t : 10, n : "testnet"})
 .argv;

var network = new StacksTestnet();
if (options.network != "testnet"){
	network = new StacksMainnet();	
}

async function readcontract(options){
	const result = await callReadOnlyFunction(options);
	return result;
}

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

		if( Math.abs(oracleprice - newfxprice) > options.threshold){
		   	//update price on oracle contract
		   	console.log("need to update price on oracle contract: ", Math.abs(oracleprice - newfxprice) , "is greater than", options.threshold);

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


