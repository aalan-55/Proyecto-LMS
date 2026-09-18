const express = require("express");
const HttpError = require("../classes/HttpError");

module.exports = (request, response, next) => {
  next(new HttpError("Not Found", 404));
};
