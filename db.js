/** Database connection for messagely. */
const { Client } = require("pg");

let database;

if (process.env.NODE_ENV === "test") {
  database = "messagely_test";
} else {
  database = "messagely";
}

let db = new Client({
  /// connectionString: DB_URI,
  user: "postgres",
  password: "postgres",
  database: database,
});

db.connect();

module.exports = db;
