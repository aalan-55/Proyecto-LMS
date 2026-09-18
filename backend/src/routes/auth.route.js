const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../classes/HttpError");
const user_model = require("../models/user.model");

const { login_schema } = require("../schemas/login.schema");
const auth_middleware = require("../middleware/auth.middleware");

const router = express.Router();

function generate_tokens(user) {
  const access_token = jwt.sign({ uuid: user.uuid, type: "access_token" }, process.env.JTW_KEY, { expiresIn: "1h" });
  const refresh_token = jwt.sign({ uuid: user.uuid, type: "refresh_token" }, process.env.JTW_KEY, { expiresIn: "7d" });

  return [access_token, refresh_token];
}

router.post("/login", login_schema, async (request, response, next) => {
    const { username, password } = request.body;

    try {
      const user = await user_model.findOne({ $or: [{ username }, { mail: username }] });
      if (!user) throw new HttpError("Invalid credentials.", 401);

      const password_valid = bcrypt.compareSync(password, user.password);
      if (!password_valid) throw new HttpError("Invalid credentials.", 401);

      const [access_token, refresh_token] = generate_tokens(user);

      return response.status(200).json({ success: true, access_token, refresh_token });
    } catch (_error) {
      next(_error);
    }
  }
);

router.get("/me", auth_middleware(), async (request, response) => {
  return response.status(200).json({ success: true, user: request.user.toSafeObject() });
});

router.post("/token", auth_middleware(), async (request, response, next) => {
  try {
    const user = request.user;
    const [access_token, refresh_token] = generate_tokens(user);

    return response.status(201).json({ success: true, access_token, refresh_token });
  } catch (_error) {
    return next(new HttpError("Invalid credentials or your credentials have expired.", 401));
  }
});

module.exports = router;
