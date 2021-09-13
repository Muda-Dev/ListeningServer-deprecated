

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
  


    
  



module.exports = confirmEtherTransaction