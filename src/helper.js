
import { request } from "http";
import DbHelper from "./dbHelper.js";
export default class Helper {


    async UpdateLastSeenBlock(blockNo) {
        var sql = "Update lastblock SET lastSeenBlock = '" + blockNo + "'";
        const response = await DbHelper.pdo(sql)
        return response;
    }

    async GetLastBlock() {
        var sql = "select lastSeenBlock from lastblock";
        const response = await DbHelper.pdo(sql)
        return response.lastSeenBlock;
    }


    makeRequest(url, method = "GET", payload = null) {
        var options = {
            'method': method,
            'url': process.env.MUDA_URL + url,
            'headers': {
                'Content-Type': 'application/json'
            },
            body: payload

        };
        return new Promise((resolve, reject) => {
            request(options, function (error, response) {
                if (error) {
                    console.log(error)
                    resolve(false)
                }
                else {
                    console.log(response)
                    resolve(response.body)

                }
            });
        });
    }
}


