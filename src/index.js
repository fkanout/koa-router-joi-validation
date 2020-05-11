import Joi from "@hapi/joi";
export { default as Joi } from "@hapi/joi";

const alternativeValidation = async (alternate, schema, values, config) => {
  let errorMsg = "";
  let _original = {};
  let details = [];

  for (const v in values) {
    try {
      await handleErrorWithSource(
        alternate,
        Joi.alternatives()
          .try({
            ...schema
          })
          .validateAsync(values[v], {
            allowUnknown: !config.denyUnknown.includes(v)
          })
      );
      return; // returning after first validation succeed
    } catch (err) {
      errorMsg += `${err.message}; `;
      _original[v] = err._original[v];
      details = [...details, ...err.details];
    }
  }

  const error = new Error(errorMsg.trim());
  error.name = "ValidationError";
  error.source = alternate;
  error.details = details;
  error._original = _original;

  throw error;
};

const handleErrorWithSource = async (source, fn) => {
  try {
    await fn;
  } catch (error) {
    if (source === 'schema') {
      error.message = error.details[0].context.message;
    }
    error.source = source;
    throw error;
  }
};
export default inputs => {
  const { query, params, body, headers, schema, config } = inputs;

  if (
    config !== undefined &&
    Object.prototype.toString.call(config) !== "[object Object]"
  ) {
    throw { message: `Route config, expecting config to be an Object` };
  }

  if (config && config.alternate && !Array.isArray(config.alternate)) {
    throw { message: `Config's alternate option should be an array` };
  }

  if (config && config.denyUnknown && !Array.isArray(config.denyUnknown)) {
    throw { message: `Config's denyUnknown option should be an array` };
  }

  if (schema && !Joi.isSchema(schema)) {
    throw { message: `Schema should be a Joi object` };
  }

  const _config = {
    denyUnknown: [],
    httpErrorCode: 400,
    nextOnError: false,
    alternate: [],
    ...config
  };

  return async (ctx, next) => {
    let alternateSchema = {};
    let alternateData = {};

    if (_config.alternate.includes("query")) {
      alternateSchema = { query, ...alternateSchema };
      alternateData = { query: { query: ctx.query }, ...alternateData };
    }

    if (_config.alternate.includes("body")) {
      alternateSchema = { body, ...alternateSchema };
      alternateData = { body: { body: ctx.request.body }, ...alternateData };
    }

    if (_config.alternate.includes("params")) {
      alternateSchema = { params, ...alternateSchema };
      alternateData = { params: { params: ctx.params }, ...alternateData };
    }

    if (_config.alternate.includes("headers")) {
      alternateSchema = { headers, ...alternateSchema };
      alternateData = { headers: { headers: ctx.headers }, ...alternateData };
    }

    try {
      if (schema) {
        await handleErrorWithSource(
          "schema",
          schema.validateAsync({
            query: ctx.query,
            body: ctx.request.body,
            params: ctx.params,
            headers: ctx.headers
          })
        );
      }

      if (query && !_config.alternate.includes("query")) {
        await handleErrorWithSource(
          "query",
          Joi.object(query)
            .unknown(!_config.denyUnknown.includes("query"))
            .validateAsync(ctx.query)
        );
      }

      if (params && !_config.alternate.includes("params")) {
        await handleErrorWithSource(
          "params",
          Joi.object(params).validateAsync(ctx.params)
        );
      }

      if (body && !_config.alternate.includes("body")) {
        await handleErrorWithSource(
          "body",
          Joi.object(body)
            .unknown(!_config.denyUnknown.includes("body"))
            .validateAsync(ctx.request.body)
        );
      }

      if (headers && !_config.alternate.includes("headers")) {
        const headersLowered = Object.keys(headers).reduce(
          (destination, key) => {
            destination[key.toLowerCase()] = headers[key];
            return destination;
          },
          {}
        );
        await handleErrorWithSource(
          "headers",
          Joi.object(headersLowered)
            .unknown(!_config.denyUnknown.includes("headers"))
            .validateAsync(ctx.headers)
        );
      }

      // validation of alternates
      if (_config.alternate.length) {
        await alternativeValidation(
          _config.alternate,
          alternateSchema,
          alternateData,
          _config
        );
      }

      await next();
      // Output validator
      if (inputs[ctx.status]) {
        await handleErrorWithSource(
          "output",
          Joi.object(inputs[ctx.status]).validateAsync(ctx.body)
        );
      }
    } catch (error) {
      if (_config.nextOnError) {
        ctx.state.routeValidationError = error;
        if (error.source !== "output") await next();
      } else {
        ctx.throw(_config.httpErrorCode, error);
      }
    }
  };
};
