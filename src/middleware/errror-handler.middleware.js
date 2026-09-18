const HttpError = require("../classes/HttpError");

module.exports = (_error, request, response, next) => {
  if (_error.name === "HttpError") {
    return response.status(_error.code).json({
      success: false,
      message: _error.message || "Unknown Error",
      code: _error.code || 400
    });
  }

  return response.status(500).json({
    success: false,
    code: 500,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : _error.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : _error.stack
  });
};
