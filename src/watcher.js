const Web3 = require('web3')
const TOKEN_ABI = require('./abi')
const Decimal = require('decimal.js')
const con = require('../dbconnector')

const WEI = 1000000000000000000
const ethToWei = (amount) => new Decimal(amount).times(WEI)
const weiToETH = (amount) => new Decimal(amount)/WEI



function watchEtherTransfers() {
  // Instantiate web3 with WebSocket provider
  const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.INFURA_WS_URL))

  // Instantiate subscription object
  const subscription = web3.eth.subscribe('pendingTransactions')

  // Subscribe to pending transactions
  subscription.subscribe((error, result) => {
    if (error) console.log(error)
  })
    .on('data', async (txHash) => {
      try {
        // Instantiate web3 with HttpProvider
        const web3Http = new Web3(process.env.INFURA_URL)

        // Get transaction details
        const trx = await web3Http.eth.getTransaction(txHash)

        const valid = validateTransaction(trx)
        // If transaction is not valid, simply return
        if (!valid) return

        console.log('Found incoming transaction from ' + trx.from + ' to ' + trx.to);
        console.log('Transaction value is: ' + trx.value)
        console.log('Transaction hash is: ' + txHash + '\n')

        // Initiate transaction confirmation
        confirmEtherTransaction(trx,txHash)

        // Unsubscribe from pending transactions.
        //subscription.unsubscribe()
      }
      catch (error) {
        console.log(error)
      }
    })
}

function validateTransaction(trx) {
	//console.log(trx)
	try{
  const toValid = trx.to !== null
  if (!toValid) return false
  
  const walletToValid = trx.to.toLowerCase() === process.env.WALLET_TO.toLowerCase()
  //const walletFromValid = trx.from.toLowerCase() === process.env.WALLET_FROM.toLowerCase()
  const amountValid = ethToWei(process.env.AMOUNT).equals(trx.value)


  return toValid && walletToValid
}catch(e){
	console.log("....")
	return false
}
}

function watchTokenTransfers() {
  // Instantiate web3 with WebSocketProvider
  const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.INFURA_WS_URL))

  // Instantiate token contract object with JSON ABI and address
  const tokenContract = new web3.eth.Contract(
    TOKEN_ABI, process.env.TOKEN_CONTRACT_ADDRESS,
    (error, result) => { if (error) console.log(error) }
  )

  // Generate filter options
  const options = {
    filter: {
      _to:    process.env.WALLET_TO
    },
    fromBlock: 'latest'
  }

  // Subscribe to Transfer events matching filter criteria
  tokenContract.events.Transfer(options, async (error, event) => {
    if (error) {
      console.log(error)
      return
    }
	let txHash = event.transactionHash;

    console.log('Found incoming cUSD transaction from ' +txHash);
    
	const web3Http = new Web3(process.env.INFURA_URL)

        // Get transaction details
        const trx = await web3Http.eth.getTransaction(txHash)
		console.log(trx)

        const valid = validateTransaction(trx)
        // If transaction is not valid, simply return
        if (!valid) return

        console.log('Found incoming transaction from ' + trx.from + ' to ' + trx.to);
        console.log('Transaction value is: ' + trx.value)
        console.log('Transaction hash is: ' + txHash + '\n')

        // Initiate transaction confirmation
        confirmEtherTransaction(trx,txHash)
		

    return
  })
}


async function getConfirmations(txHash) {
  try {
    // Instantiate web3 with HttpProvider
    const web3 = new Web3(process.env.INFURA_URL)

    // Get transaction details
    const trx = await web3.eth.getTransaction(txHash)

    // Get current block number
    const currentBlock = await web3.eth.getBlockNumber()

    // When transaction is unconfirmed, its block number is null.
    // In this case we return 0 as number of confirmations
    return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
  }
  catch (error) {
    console.log(error)
  }
}

function confirmEtherTransaction(trx,txHash, confirmations = 4) {
  setTimeout(async () => {
    // Get current number of confirmations and compare it with sought-for value
    const trxConfirmations = await getConfirmations(txHash)
    console.log('Transaction with hash ' + txHash + ' has ' + trxConfirmations + ' confirmation(s)')

    if (trxConfirmations >= confirmations) {
      // Handle confirmation event according to your business logic

      console.log('Transaction with hash ' + txHash + ' has been successfully confirmed')
	  completeTransaction(txHash,trx.from,trx.value)

      return
    }
    // Recursive call
    return confirmEtherTransaction(trx,txHash, confirmations)
  }, 30 * 1000)
}


async function completeTransaction(txHash,received_from,received_eth_amount){
 
       con.connect(function(err) {
        if (err) console.log("connection failed"+err);
        console.log("Connected!");
        var sql = "INSERT INTO hd_transactions (eth_trans_hash, received_eth_amount, sent_xlm_amount, eth_received_from, xlm_sent_to) "
        +"VALUES ('"+txHash+"', '"+received_eth_amount+"', "+sent_xlm_amount+", '"+received_from+"', '"+receiverKey+"')";
         con.query(sql, async function (err, result) {
          if (err) {console.log("error found "+err)}else{
              console.log("1 record inserted");
              rs = await makePathPayment(senderPvKey,receiverKey,sent_xlm_amount);
              console.log("transaction complete with transaction is "+rs)
              updateTxn(txHash,rs)
          }
          
        });
      });


  }
  
  
module.exports = {
  watchEtherTransfers,
  watchTokenTransfers
}