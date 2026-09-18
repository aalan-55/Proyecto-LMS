module.exports = (type, schema) => async (request, response, next) => {
  try {
    let data = request[type];
    let validated = await schema.validateAsync(data, { abortEarly: false });

    request[type] = validated;

    next();
  } catch (error) {
    const validation_errors = [];

    if (error.details) {
      error.details.forEach(({ context: { label }, message }) => {
        validation_errors.push({ key: label, error: message.replace(/"/g, "") });
      });
    }

    return response.status(422).json({ code: 422, message: `${type} validation failed.`, errors: validation_errors });
  }
};
