// This script will watch for events emitted by contracts specified in the `watchedAddresses` array.
// Adding to the `topics` array will filter events 
// More info on topics can be found here: https://solidity.readthedocs.io/en/develop/abi-spec.html#events

// At the time of writing, Forno websocket connections are disconnected after 20 minutes
// When the websocket connection is broken, the script will stop listening for 500ms before attempting to reconnect
// If a block is created during that gap, the relevant events in that block will be missed. Running two or more listeners concurrently will reduce the chance of missed blocks 
const cUSD_abi = require('./abi')
const Web3 = require('web3')

let watchedAddresses = ["0xF968575Dc8872D3957E3b91BFAE0d92D4c9c1Dd5"] // cUSD contract
let topics  = [] 
let lastSeenBlock = null

function setupProviderAndSubscriptions() {
    
    let provider = new Web3.providers.WebsocketProvider('wss://alfajores-forno.celo-testnet.org/ws')
    let web3 = new Web3(provider)
    let setupNewProvider = false
    
    // Keeps track of the number of times we've retried to set up a new provider
    // and subs without a successful header
    let sequentialRetryCount = 0
    
    const setupNewProviderAndSubs = async () => {
        // To prevent us from retrying too aggressively, wait a little if
        // we try setting up multiple times in a row
        const sleepTimeMs = sequentialRetryCount * 100
        console.log('sleeping', sleepTimeMs)
        await sleep(sleepTimeMs)
        sequentialRetryCount++
        // To avoid a situation where multiple error events are triggered
        if (!setupNewProvider) {
            setupNewProvider = true
            setupProviderAndSubscriptions()
        }
    }
    
    provider.on('error', async (error, any) => {
        console.log('WebsocketProvider encountered an error', error)
        await setupNewProviderAndSubs()
    })
    
    provider.on('end', async () => {
        console.log('WebsocketProvider has ended, will restart')
        await setupNewProviderAndSubs()
    })
    
    let headerSubscription = web3.eth.subscribe('newBlockHeaders')
    
    headerSubscription.on('data', function(blockHeader, any) {
        if (sequentialRetryCount > 0) {
          sequentialRetryCount = 0
        }
        lastSeenBlock = blockHeader.number
    })
    
    let eventSubscription = web3.eth.subscribe('logs', {
        address: watchedAddresses,
        fromBlock: lastSeenBlock,
        topics: topics
    })
    
    eventSubscription.on('data', function (data, any) {
        console.log(data)
    })
    
    eventSubscription.on('error', async (error, any) => {
        console.log('Block header subscription encountered an error', error)
        await setupNewProviderAndSubs()
    })
}

setupProviderAndSubscriptions();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}