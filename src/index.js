const con = require('../dbconnector')
const request = require('request');

const cUSD_abi = require('./abi')
const Web3 = require('web3')

let watchedAddresses = ["0xF17DB59dA5ddc58E08de2AD83478391Ab9797d50"] // cUSD contract
let nativeAddress = "0xA4dF4ac85d67DFAFe786dB96eF44d5c42E7a443e"
let topics  = [] 
let lastSeenBlock = null
let Init = true;
let MUDA_ENDPOINT = 'http://192.168.43.170:8001/';


con.connect(function(err) {
    if (err) return  "database connection failed";
    console.log("Connected to the database");

	GetLastBlock();
	
  });




function setupProviderAndSubscriptions() {
    
    let provider = new Web3.providers.WebsocketProvider('wss://alfajores-forno.celo-testnet.org/ws')
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
    
    headerSubscription.on('data', function(blockHeader, any) {

        if (sequentialRetryCount > 0) {
          sequentialRetryCount = 0
        }
	
		lastSeenBlock = blockHeader.number
		console.log("Last Seen block",lastSeenBlock )
		UpdateLastSeenBlock(lastSeenBlock);
		
        

    })
    
    let eventSubscription = web3.eth.subscribe('logs', {
        address: watchedAddresses,
        fromBlock: lastSeenBlock,
        topics: topics
    })
    
    eventSubscription.on('data', function (data, any) {
        console.log("Received a new transaction", data)
		getTransaction(data.transactionHash);
    })
    
    eventSubscription.on('error', async (error, any) => {
        console.log('Block header subscription encountered an error', error)
        await setupNewProviderAndSubs()
    })
}


async function UpdateLastSeenBlock(blockNo){
        var sql = "Update lastblock SET lastSeenBlock = '"+blockNo+"'";
         con.query(sql, async function (err, result) {
          if (err) {console.log("error found "+err)}else{
              console.log("Block Logged");
          }
        });
}

async function GetLastBlock(blockNo){
        var sql = "select lastSeenBlock from lastblock";
         con.query(sql, async function (err, result) {
          if (err) {console.log("error found "+err)}else{
			 lastSeenBlock = result[0]['lastSeenBlock'];
             console.log("Resuming from block ",lastSeenBlock);
			 setupProviderAndSubscriptions();
          }
        });
}


async function getTransaction (transHash) {
var options = {
  'method': 'GET',
  'url': MUDA_ENDPOINT+'get_transaction/'+transHash,
  'headers': {
	      'Content-Type': 'application/json'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
  const json = JSON.parse(response.body)
  const sent_to  = json.sent_to
  const sent_from  = json.sent_from
  const recipient_account_number  = json.recipient_account_number
  if(sent_to.toLowerCase() == nativeAddress.toLowerCase() ){
	  console.log("Payment received from ",sent_from);
	  console.log("Sending Utlity to ",recipient_account_number);
	  getService(json);
  }

});

}

function getService(json){
var id = json.service_id
var options = {
  'method': 'GET',
  'url': MUDA_ENDPOINT+'service/'+id,
  'headers': {
  }
};
console.log(options)
request(options, function (error, response) {
  if (error) throw new Error(error);
const serviceJson = JSON.parse(response.body)
console.log(response.body)
sendPayment(json, serviceJson)
	
});

}
function sendPayment(json, serviceJson){
	
var category = serviceJson.category
var service_name = serviceJson.service_name
var provider_id = serviceJson.provider_id
var provider_name = serviceJson.provider_name
var amount = json.amount
var recipient_account_number = json.recipient_account_number

var sms = "You have received UGX "+amount+" worth of "+service_name+" from "+provider_name;

SendSMS(recipient_account_number, sms)

console.log("Transaction completed ");
UpdateTransaction(json.txn_hash,lastSeenBlock,"success");
	 
}

async function UpdateTransaction (transHash,payment_txn_id,pay_status) {
var options = {
  'method': 'POST',
  'url': MUDA_ENDPOINT+'account/update_payment_record',
  'headers': {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "txn_hash": transHash,
    "amount_sent": 500,
    "payment_txn_id": payment_txn_id,
    "payment_status": pay_status,
    "payload": {
      "service_id": "1"
    }
  })

};
console.log(options)
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});

}

//tests
async function SendSMS(phone,message){
	console.log("sms sent")
var options = {
  'method': 'POST',
  'url': 'https://clic.world/fedapi/v2/sms.php',
  'headers': {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  form: {
    'phone': phone,
    'message': message
  }
};
console.log(options)
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}