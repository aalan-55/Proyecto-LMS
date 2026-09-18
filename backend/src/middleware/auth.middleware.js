const json_web_token = require("jsonwebtoken");

const HttpError = require("../classes/HttpError");
const user_model = require("../models/user.model")

module.exports = () => async (request, response, next) => {
  const authorization = request.header("Authorization");

  console.log(authorization)
  try {
    if (!authorization) {
      throw new HttpError("No Credentials Supplied", 401);
    }

    let payload;
    try {
      payload = json_web_token.verify(authorization, process.env.JTW_KEY);
      console.log(payload)
    } catch (_error) {
      if (_error.name === "TokenExpiredError") {
        throw new HttpError("Token Expired", 401);
      }

      throw new HttpError("Invalid Token", 403);
    }

    const { uuid } = payload;
    if (!uuid) {
      throw new HttpError("Invalid Token Payload", 403);
    }


    const user = await user_model.findOne({ uuid });
    if (!user) {
      throw new HttpError("Invalid Credentials", 403);
    }

    request.user = user;

    next();
  } catch (_error) {
    return next(_error.name === "HttpError" ? _error : new HttpError("Invalid Credentials", 403));
  }
};
