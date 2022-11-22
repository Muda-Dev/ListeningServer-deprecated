import * as mysql from 'mysql2';
import * as  dotEnv from 'dotenv'
dotEnv.config()
class DbHelper {

  constructor() {
    this.normalPool = this.initializePool('normal');
  }

  initializePool() {
    console.log("db initialize", process.env.DB_NAME)
    return mysql.createPool({
      connectionLimit: 1,
      host: process.env.HOST_NAME,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      timezone: 'Z',
    });

  }
  pdo(query) {
    const pdoConnect = this.normalPool;
    return new Promise((resolve, reject) => {
      pdoConnect.getConnection((err, connection) => {
        if (err) {
          console.log(err);
          console.log('Here');
          return reject(err);
        }

        connection.query(query, (error, results, fields) => {
          connection.release();
          if (error) return reject(error);
          const result = results.length > 0 ? JSON.parse(JSON.stringify(results[0])) : [];
          resolve(result);
        });
      });
    });
  }

}
export default new DbHelper();
