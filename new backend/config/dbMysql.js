const mysql = require("mysql2/promise");

let mysqlConn;

async function connectMySQL() {
  if (!mysqlConn) {
    mysqlConn = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123",
      database: "db_PKL",
    });
    console.log("✅ MySQL connected");
  }
  return mysqlConn;
}

module.exports = { connectMySQL };
