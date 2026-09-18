const joi = require("joi");
const schema_validation = require("../middleware/schema.middleware"); 

const login_schema = schema_validation("body", joi.object({
    username: joi.string()
      .min(3)
      .max(100)
      .regex(/[a-zA-Z0-9]/)
      .required()
      .label("Username"),

    password: joi.string()
      .min(6)
      .max(30)
      .required()
      .label("Password")
  })
);

module.exports = { login_schema };