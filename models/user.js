/** User class for message.ly */

/** User of the site. */
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users 
      ( username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at)
             VALUES ($1, $2, $3, $4,$5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
             RETURNING username,password,first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );

    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );
    let user = result.rows[0];

    return user && (await bcrypt.compare(password, user.password));
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users set last_login_at = CURRENT_TIMESTAMP WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(`SELECT * FROM users`);

    const users = result.rows.map((row) => ({
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      join_at: row.join_at,
      last_login_at: row.last_login_at,
    }));
    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return null; // Return null if no user with the given username is found
    }

    const user = {
      username: result.rows[0].username,
      first_name: result.rows[0].first_name,
      last_name: result.rows[0].last_name,
      phone: result.rows[0].phone,
      join_at: result.rows[0].join_at,
      last_login_at: result.rows[0].last_login_at,
    };

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
       m.to_username,
       u.first_name, 
       u.last_name, 
       u.phone,
       m.body,
       m.sent_at,
       m.read_at
       FROM messages  as  m join users as  u
       on m.to_username = u.username
       WHERE m.from_username = $1`,
      [username]
    );
    return result.rows.map((m) => ({
      id: m.id,
      body: m.body,
      sent_at: m.sent_at,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id,
       m.from_username,
       u.first_name, 
       u.last_name, 
       u.phone,
       m.body,
       m.sent_at,
       m.read_at
       FROM messages  as  m join users as  u
       on m.from_username = u.username
       WHERE to_username = $1`,
      [username]
    );
    return result.rows.map((m) => ({
      id: m.id,
      body: m.body,
      sent_at: m.sent_at,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
    }));
  }
}

module.exports = User;
