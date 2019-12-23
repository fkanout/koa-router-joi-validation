"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _joi = _interopRequireDefault(require("@hapi/joi"));

var _default = inputs => {
  return async (ctx, next) => {
    try {
      const {
        query,
        params,
        body,
        headers
      } = inputs;

      if (query) {
        await _joi.default.object(query).validateAsync(ctx.query);
      }

      if (params) {
        await _joi.default.object(params).validateAsync(ctx.params);
      }

      if (body) {
        await _joi.default.object(body).validateAsync(ctx.request.body);
      }

      if (headers) {
        // the framework make the headers entries lowercase-ed, so Joi schema should lowercase-ed as well to match.
        const headersLowered = Object.keys(headers).reduce((destination, key) => {
          destination[key.toLowerCase()] = headers[key];
          return destination;
        }, {});
        await _joi.default.object(headersLowered).unknown(true) // Allow unchecked headers entries to be sent.
        .validateAsync(ctx.headers);
      }

      await next(); // Output validator

      if (inputs[ctx.status]) {
        await _joi.default.object(inputs[ctx.status]).validateAsync(ctx.body);
      }
    } catch (error) {
      // console.log(error);
      ctx.throw(400, error);
    }
  };
};

exports.default = _default;
//# sourceMappingURL=index.js.map