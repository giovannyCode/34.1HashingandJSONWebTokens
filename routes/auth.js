const express = require("express");
const User = require("../models/user");
const router = new express.Router();
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function (req, res, next) {
  try {
    const { username, password } = req.body;

    const isRealUser = await User.authenticate(username, password);
    if (isRealUser) {
      let token = jwt.sign({ username }, SECRET_KEY);
      User.updateLoginTimestamp(username);

      return res.json({ token });
    }
    throw new ExpressError("Invalid user/password", 400);
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function (req, res, next) {
  try {
    const { username, password, first_name, last_name, phone } = req.body;

    const result = await User.register({
      username,
      password,
      first_name,
      last_name,
      phone,
    });

    if (result) {
      let payload = { username };
      let token = jwt.sign(payload, SECRET_KEY);
      return res.json({ token });
    }
    throw new ExpressError("Error Creating User", 400);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
