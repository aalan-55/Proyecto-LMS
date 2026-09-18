const joi = require("joi");
const schema_validation = require("../middleware/schema.middleware");

const create_submission = schema_validation("body", joi.object({
    task_uuid: joi.string()
      .uuid()
      .required()
      .label("Task UUID"),

    file_url: joi.string()
      .uri()
      .required()
      .label("Submission File URL"),

    comment: joi.string()
      .max(1000)
      .allow("")
      .label("Student Comment"),
  })
);

module.exports = { create_submission };