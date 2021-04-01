# stxoracle

This cli tool helps to create/deploy/update price feeds on Stacks blockchain that can be used as oracles for other contracts.

## Requirements
* Node v12.20.2 (npm v6.14.11)
* stacks cli if you don't have it already
`npm install -g @stacks/cli`

## Installation
1. Clone the repository
```git clone https://github.com/pseudozach/stxoracle.git```

2. Run with `node ./bin/index.js` or install globally with `npm install -g .`

## Usage
* Script needs privatekey as input so convert your mnemonic to privatekey if you dont already have it
`stx get_stacks_wallet_key --backup_phrase "your 24 word seed phrase"`

* You need following inputs to the script
```
  -b, --base                       Base ticker (e.g. BTC)    [string] [required]
  -c, --convert                    Convert ticker (e.g. USD) [string] [required]
  --ca, --contractaddress          Oracle contract address   [string] [required]
  --cn, --contractname             Oracle contract name      [string] [required]
  --cfu, --contractfunctionupdate  Oracle contract function for update
                                                             [string] [required]
  --cfr, --contractfunctionread    Oracle contract function for reading
                                                             [string] [required]
  -t, --threshold                  Price threshold for updating price on
                                   contract               [string] [default: 10]
  -p, --privkey                    Private key that controls oracle contract
                                                             [string] [required]
  -k, --pubkey                     Public key that interacts with oracle
                                   contract                  [string] [required]
  -n, --network                    Network: mainnet or testnet
                                                   [string] [default: "testnet"]
```

* Once you have all required inputs, run stxoracle command as below. This command will;
  * Fetch updated price information from cryptocompare API
  * Fetch current BTC/USD price on the specificed contract on Stacks
  * If the price difference is greater than threshold, update the price on the blockchain.

```
stxoracle -b BTC -c USD --ca 'ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ' --cn oracle_btcusd --cfr 'get-price' --cfu 'update-price' -t 8 -p 'yourprivatekey'  -n testnet
```
