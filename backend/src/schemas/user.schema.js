const joi = require("joi");
const schema_validation = require("../middleware/schema.middleware");

const create_user_schema = schema_validation("body", joi.object({
  mail: joi.string(),

  username: joi.string()
    .min(3)
    .max(100)
    .required(),

  password: joi.string()
    .min(6)
    .max(50)
    .required(),

  level: joi.number()
    .integer()
    .min(0)
    .max(2)
    .required()
}));

module.exports = { create_user_schema };
