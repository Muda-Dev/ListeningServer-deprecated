require('./env')
 
const watcher = require('./watcher')
const con = require('../dbconnector')
const request = require('request');
con.connect(function(err) {
    if (err) return  "database connection failed";
    console.log("Connected!");
  });


watcher.watchEtherTransfers()
console.log('Started watching CELO transfers')

watcher.watchTokenTransfers()
console.log('Started watching cUGX token transfers\n')
