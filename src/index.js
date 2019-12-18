import Joi from "@hapi/joi";
export default inputs => {
  return async (ctx, next) => {
    try {
      const { query, params, body, headers } = inputs;
      if (query) {
        await Joi.object(query).validateAsync(ctx.query);
      }
      if (params) {
        await Joi.object(params).validateAsync(ctx.params);
      }
      if (body) {
        await Joi.object(body).validateAsync(ctx.request.body);
      }
      if (headers) {
        // the framework make the headers entries lowercase-ed, so Joi schema should lowercase-ed as well to match.
        const headersLowered = Object.keys(headers).reduce((destination, key) => {
          destination[key.toLowerCase()] = headers[key];
          return destination;
        }, {});
        await Joi.object(headersLowered)
          .unknown(true) // Allow unchecked headers entries to be sent.
          .validateAsync(ctx.headers);
      }
      await next();
      // Output validator
      if (inputs[ctx.status]) {
        await Joi.object(inputs[ctx.status]).validateAsync(ctx.body);
      }
    } catch (error) {
      ctx.throw(400, error);
    }
  };
};
