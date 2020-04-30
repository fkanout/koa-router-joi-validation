import Joi from "@hapi/joi";
export { default as Joi } from "@hapi/joi";

const alternativeValidation = async (alternate, schema, values) => {
  let error;
  for (const v in values) {
    try {
      await handleErrorWithSource(
        alternate,
        Joi.alternatives()
          .try({
            ...schema
          })
          .validateAsync(values[v], {
            allowUnknown: true
          })
      );
      return; // returning after first validation succeed
    } catch (err) {
      error = err;
    }
  }
  // throwing last error
  // TODO: should we fabricate our custom error indicating about failing alternatives and combining all errors messages?
  throw error;
};

const handleErrorWithSource = async (source, fn) => {
  try {
    await fn;
  } catch (error) {
    error.source = source;
    throw error;
  }
};
export default inputs => {
  const { query, params, body, headers, config } = inputs;

  if (
    config !== undefined &&
    Object.prototype.toString.call(config) !== "[object Object]"
  ) {
    throw { message: `Route config, expecting config to be an Object` };
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
          alternateData
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
