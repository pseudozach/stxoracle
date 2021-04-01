# stxoracle

This cli tool helps to deploy and update price feeds on Stacks blockchain that can be used as oracles for other contracts.

## Requirements
* Node v12.20.2 (npm v6.14.11)
* stacks cli 
`npm install -g @stacks/cli`

## Installation
1. Clone the repository
```git clone https://github.com/pseudozach/stxoracle.git```

2. Run with `node ./bin/index.js` or install globally with `npm install -g .`

## Usage
* Script needs privatekey as input so convert your mnemonic to privatekey if you dont already have it

```stx get_stacks_wallet_key --backup_phrase "your 24 word seed phrase"```

1. Create a new price feed oracle, you need following inputs to the script:
```
# stxoracle generate --help
stxoracle generate

Deploy a new price feed oracle contract

Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  -b, --base     Base ticker (e.g. BTC)                      [string] [required]
  -c, --convert  Convert ticker (e.g. USD)                   [string] [required]
  -p, --privkey  Private key that deploys the oracle contract[string] [required]
  -k, --pubkey   Public key that deploys the oracle contract [string] [required]
  -n, --network  Network: mainnet or testnet       [string] [default: "testnet"]
```

* This command will deploy a new price feed oracle contract on testnet based on [priceoracle.clar](https://github.com/pseudozach/stxoracle/blob/main/priceoracle.clar) that's included in the repository. This contract includes ways to:
  * Read the price
  * Update the price
  * Read oracle address 
  * Update the oracle address that can update the price
```
stxoracle generate -b BTC -c USD -p 'yourprivatekey' -k 'yourstxaddress'
```

2. Update an existing price feed oracle, you need following inputs to the script:
```
# stxoracle update --help
stxoracle update

Check and update an existing price feed oracle contract

Options:
  --help                           Show help                           [boolean]
  --version                        Show version number                 [boolean]
  -b, --base                       Base ticker (e.g. BTC)    [string] [required]
  -c, --convert                    Convert ticker (e.g. USD) [string] [required]
  -p, --privkey                    Private key that controls oracle contract
                                                             [string] [required]
  -k, --pubkey                     Public key that interacts with oracle
                                   contract
                 [string] [default: "ST15RGYVK9ACFQWMFFA2TVASDVZH38B4VAV4WF6BJ"]
  --ca, --contractaddress          Oracle contract address   [string] [required]
  --cn, --contractname             Oracle contract name      [string] [required]
  --cfu, --contractfunctionupdate  Oracle contract function for update
                                              [string] [default: "update-price"]
  --cfr, --contractfunctionread    Oracle contract function for reading
                                                 [string] [default: "get-price"]
  -t, --threshold                  Price threshold for updating price on
                                   contract               [string] [default: 10]
  -n, --network                    Network: mainnet or testnet
                                                   [string] [default: "testnet"]
```

* This command will;
  * Fetch updated price information from [cryptocompare API](https://min-api.cryptocompare.com/documentation)
  * Fetch current BTC/USD price on the specificed contract on Stacks
  * If the price difference is greater than threshold, update the price on the blockchain.

```
stxoracle update -b BTC -c USD --ca 'yourstxaddress' --cn oracle_btcusd -t 8 -p 'yourprivatekey'
```

* Note that it makes sense to run this script as a cron job so it can check the price every 30 minutes and keep it up to date. You could accomplish this by:
```
# crontab -e
*/30 * * * * stxoracle update -b BTC -c USD --ca 'yourstxaddress' --cn oracle_btcusd -t 8 -p 'yourprivatekey'
```

## Explorer
For a list of price feed oracles that are deployed by this library, please visit [stxoracle list](https://github.com/pseudozach/stxoracle/wiki/stxoracle-list)

