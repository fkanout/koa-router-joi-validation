import Joi from "@hapi/joi";
export { Joi } from "@hapi/joi";
export default inputs => {
  const { query, params, body, headers, config } = inputs;
  if (config !== undefined && typeof config !== "object" && !Array.isArray(config)) {
    throw new Error(`Route config, expecting object but found ${typeof config}`);
  }
  console.log(typeof config);

  const _config = {
    denyUnknown: [],
    httpErrorCode: 400,
    nextOnError: false,
    ...config
  };

  return async (ctx, next) => {
    try {
      if (query) {
        await Joi.object(query)
          .unknown(!_config.denyUnknown.includes("query"))
          .validateAsync(ctx.query);
      }
      if (params) {
        await Joi.object(params).validateAsync(ctx.params);
      }
      if (body) {
        await Joi.object(body)
          .unknown(!_config.denyUnknown.includes("body"))
          .validateAsync(ctx.request.body);
      }
      if (headers) {
        const headersLowered = Object.keys(headers).reduce((destination, key) => {
          destination[key.toLowerCase()] = headers[key];
          return destination;
        }, {});
        await Joi.object(headersLowered)
          .unknown(!_config.denyUnknown.includes("headers"))
          .validateAsync(ctx.headers);
      }
      await next();
      // Output validator
      if (inputs[ctx.status]) {
        await Joi.object(inputs[ctx.status]).validateAsync(ctx.body);
      }
    } catch (error) {
      if (_config.nextOnError) {
        ctx.state.routeValidationError = error;
      } else {
        ctx.throw(_config.httpErrorCode, error);
      }
    }
  };
};
