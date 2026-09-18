const joi = require("joi");
const schema_validation = require("../middleware/schema.middleware"); 

const task_schema = schema_validation("body", joi.object({
    title: joi.string()
      .min(3)
      .max(200)
      .required()
      .label("Task Title"),

    description: joi.string()
      .min(5)
      .max(5000)
      .required()
      .label("Task Description"),

    attachments: joi.array().items(
      joi.object({
        name: joi.string().required(),
        url: joi.string().uri().required(),
        file_type: joi.string().valid('pdf', 'link', 'doc').required()
      })
    ).default([]),

    class_id: joi.string()
      .hex()
      .length(24)
      .required()
      .label("Class ID"),

    due_date: joi.date()
      .greater('now')
      .required()
      .label("Task Due Date")
  })
);

module.exports = { task_schema };