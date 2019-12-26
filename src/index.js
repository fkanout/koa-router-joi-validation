import Joi from "@hapi/joi";
export { Joi } from "@hapi/joi";

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

  if (config !== undefined && Object.prototype.toString.call(config) !== "[object Object]") {
    throw { message: `Route config, expecting config to be an Object` };
  }

  const _config = {
    denyUnknown: [],
    httpErrorCode: 400,
    nextOnError: false,
    ...config
  };

  return async (ctx, next) => {
    try {
      if (query) {
        await handleErrorWithSource(
          "query",
          Joi.object(query)
            .unknown(!_config.denyUnknown.includes("query"))
            .validateAsync(ctx.query)
        );
      }
      if (params) {
        await handleErrorWithSource("params", Joi.object(params).validateAsync(ctx.params));
      }
      if (body) {
        await handleErrorWithSource(
          "body",
          Joi.object(body)
            .unknown(!_config.denyUnknown.includes("body"))
            .validateAsync(ctx.request.body)
        );
      }
      if (headers) {
        const headersLowered = Object.keys(headers).reduce((destination, key) => {
          destination[key.toLowerCase()] = headers[key];
          return destination;
        }, {});
        await handleErrorWithSource(
          "headers",
          Joi.object(headersLowered)
            .unknown(!_config.denyUnknown.includes("headers"))
            .validateAsync(ctx.headers)
        );
      }
      await next();
      // Output validator
      if (inputs[ctx.status]) {
        await handleErrorWithSource("output", Joi.object(inputs[ctx.status]).validateAsync(ctx.body));
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
