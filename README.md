# Listening server

The Liquidity Rail Listening server is a web3 pooling service based on the [celo blockchain](https://celo.org/) , that listens for payment events on the MUDA cUGX contract and passes the event information to the service provider to provide the service to their clients.
## High Level Description

This service is supposed to be used by Banks, Telecom companies, utility service providers who wish to join the MUDA Liquidity rail community. The service provides a seem less integration between client wallets and service providers without the need for collaboration integration.

## Example Use case
Imagine a client mobile app wallet x that supports CELO blockchain, and a utility service provider eg, Water bill payment Y. Now wallet X can seamlessly allow all their clients to pay for utilities through company y without the need for these companies to collaborate or know each other. How cool is that?! With MUDA Liquidity rail, both client wallet and service providers can communicate to each other using blockchain based transactions where the token transfer is a proof os settlement and the service provider MUST guarantee payment/provision of service once tokens have been sent to them and confirmed on the blockchain.


## Installation

Use the package manager [npm](https://www.npmjs.com/) to install dependcies.
```bash
npm install
npm start
```

## Integration
Edit the ./src/intergrations.js file to add your payment login

```javascript
  payCustomer(json, serviceJson) {
    const category = serviceJson.category
    const service_name = serviceJson.service_name
    const provider_id = serviceJson.provider_id
    const provider_name = serviceJson.provider_name
    const amount = json.amount
    const recipient_account_number = json.recipient_account_number
    const service_id = serviceJson.service_id

    //ADD A FUNCTION HERE TO CALL YOUR INTERNAL PAYMENT SYSTEM and return a success or fail status
    const InternalTxId = ""
    console.log("Transaction completed ");
    this.sendIPN(json.txn_hash, InternalTxId, service_id, "success");
    //Send a webhook to the requesting client about the final status of the transaction
  }
```

```javascript
 async sendIPN(transHash, amount_sent, payment_txn_id, service_id, pay_status) {
    const json = JSON.stringify({
      "txn_hash": transHash,
      "amount_sent": amount_sent,
      "payment_txn_id": payment_txn_id,
      "payment_status": pay_status,
      "payload": {
        "service_id": service_id
      }
    });
   //send this json object to the endpoint in the .env file
  }
```



## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
