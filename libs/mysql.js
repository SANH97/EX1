var mysql = require('mysql');

require('dotenv').config()

var db = mysql.createConnection({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_DATABASE,
  dateStrings: 'date'
});
 
db.connect();
 

module.exports=db