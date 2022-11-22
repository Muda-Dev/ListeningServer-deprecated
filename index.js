import Helper from './src/helper.js';
import Intergrations from './src/intergrations.js';
import Web3 from 'web3';

let payInAddress = process.env.nativeAddress
let watchedAddresses = [process.env.CONTRACT_ADDRESS,payInAddress]
let topics = []

const helper = new Helper()
const thirdparty = new Intergrations()

let lastSeenBlock = null


init()
async function init(){
  lastSeenBlock = await helper.GetLastBlock();
  console.log("payInAddress Address",payInAddress)
  console.log("Last Saved Block",lastSeenBlock)
  setupProviderAndSubscriptions();
}

function setupProviderAndSubscriptions() {
  console.log("W3 provider,",process.env.PROVIDER)

  let provider = new Web3.providers.WebsocketProvider(process.env.PROVIDER)
  let web3 = new Web3(provider)
  let setupNewProvider = false

  let sequentialRetryCount = 0

  const setupNewProviderAndSubs = async () => {

    const sleepTimeMs = sequentialRetryCount * 100
    console.log('sleeping', sleepTimeMs)
    await sleep(sleepTimeMs)
    sequentialRetryCount++
    if (!setupNewProvider) {
      console.log('waiting..')
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

  headerSubscription.on('data', function (blockHeader, any) {

    if (sequentialRetryCount > 0) {
      sequentialRetryCount = 0
    }

    lastSeenBlock = blockHeader.number
    console.log("Current Block, ", lastSeenBlock)
    helper.UpdateLastSeenBlock(lastSeenBlock);


  })

  let eventSubscription = web3.eth.subscribe('logs', {
    address: watchedAddresses,
    fromBlock: lastSeenBlock,
    topics: topics
  })

  eventSubscription.on('data', function (data, any) {
    console.log("Received a new transaction", data)
    thirdparty.getTransaction(data.transactionHash);
  })

  eventSubscription.on('error', async (error, any) => {
    console.log('Block header subscription encountered an error', error)
    await setupNewProviderAndSubs()
  })
}






function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}