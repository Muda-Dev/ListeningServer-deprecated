
import Helper from './helper.js';
const help = new Helper()
export default class Intergrations {

  async getTransaction(transHash) {
    const url = 'get_transaction/' + transHash;
    const response = await help.makeRequest(url)
    if (response != false) {
      const json = JSON.parse(response)
      const sent_to = json.sent_to
      const sent_from = json.sent_from
      const recipient_account_number = json.recipient_account_number
      if (sent_to.toLowerCase() == nativeAddress.toLowerCase()) {
        console.log("Payment received from ", sent_from);
        console.log("Sending Utlity to ", recipient_account_number);
        const id = json.service_id
        const response = await help.makeRequest('service/' + id)
        if (response != false) {
          const serviceJson = JSON.parse(response)
          console.log(response.body)
          this.payCustomer(json, serviceJson)
        }
      }
    }
  }


  payCustomer(json, serviceJson) {

    const category = serviceJson.category
    const service_name = serviceJson.service_name
    const provider_id = serviceJson.provider_id
    const provider_name = serviceJson.provider_name
    const amount = json.amount
    const recipient_account_number = json.recipient_account_number
    const service_id = serviceJson.service_id


    // MAKE PAYMENT TO CLIENT WALLET LIKE MOBILE MONEY
    //ADD A FUNCTION HERE TO CALL YOUR INTERNAL PAYMENT SYSTEM and return a success or fail status
    //const status = success or failed
    const InternalTxId = ""

    console.log("Transaction completed ");

    this.sendIPN(json.txn_hash, InternalTxId, service_id, "success");

  }


  //NOTIFY CLIENT ABOUT THE STATUS OF THE PAYMENT
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
    const response = await help.makeRequest('account/update_payment_record', 'POST', json)
    console.log(response);

  }

}