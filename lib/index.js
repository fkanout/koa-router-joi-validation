"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Joi", {
  enumerable: true,
  get: function () {
    return _joi.Joi;
  }
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _joi = _interopRequireWildcard(require("@hapi/joi"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var _default = inputs => {
  const {
    query,
    params,
    body,
    headers,
    config
  } = inputs;

  if (config !== undefined && typeof config !== "object") {
    throw new Error(`Route config, expecting object but found ${typeof config}`);
  }

  console.log(typeof config);

  const _config = _objectSpread({
    denyUnknown: [],
    httpErrorCode: 400,
    nextOnError: false
  }, config);

  return async (ctx, next) => {
    try {
      if (query) {
        await _joi.default.object(query).unknown(!_config.denyUnknown.includes("query")).validateAsync(ctx.query);
      }

      if (params) {
        await _joi.default.object(params).validateAsync(ctx.params);
      }

      if (body) {
        await _joi.default.object(body).unknown(!_config.denyUnknown.includes("body")).validateAsync(ctx.request.body);
      }

      if (headers) {
        const headersLowered = Object.keys(headers).reduce((destination, key) => {
          destination[key.toLowerCase()] = headers[key];
          return destination;
        }, {});
        await _joi.default.object(headersLowered).unknown(!_config.denyUnknown.includes("headers")).validateAsync(ctx.headers);
      }

      await next(); // Output validator

      if (inputs[ctx.status]) {
        await _joi.default.object(inputs[ctx.status]).validateAsync(ctx.body);
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

exports.default = _default;
//# sourceMappingURL=index.js.map