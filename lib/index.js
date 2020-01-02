"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Joi", {
  enumerable: true,
  get: function () {
    return _joi.default;
  }
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _joi = _interopRequireDefault(require("@hapi/joi"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const handleErrorWithSource = async (source, fn) => {
  try {
    await fn;
  } catch (error) {
    error.source = source;
    throw error;
  }
};

var _default = inputs => {
  const {
    query,
    params,
    body,
    headers,
    config
  } = inputs;

  if (config !== undefined && Object.prototype.toString.call(config) !== "[object Object]") {
    throw {
      message: `Route config, expecting config to be an Object`
    };
  }

  const _config = _objectSpread({
    denyUnknown: [],
    httpErrorCode: 400,
    nextOnError: false
  }, config);

  return async (ctx, next) => {
    try {
      if (query) {
        await handleErrorWithSource("query", _joi.default.object(query).unknown(!_config.denyUnknown.includes("query")).validateAsync(ctx.query));
      }

      if (params) {
        await handleErrorWithSource("params", _joi.default.object(params).validateAsync(ctx.params));
      }

      if (body) {
        await handleErrorWithSource("body", _joi.default.object(body).unknown(!_config.denyUnknown.includes("body")).validateAsync(ctx.request.body));
      }

      if (headers) {
        const headersLowered = Object.keys(headers).reduce((destination, key) => {
          destination[key.toLowerCase()] = headers[key];
          return destination;
        }, {});
        await handleErrorWithSource("headers", _joi.default.object(headersLowered).unknown(!_config.denyUnknown.includes("headers")).validateAsync(ctx.headers));
      }

      await next(); // Output validator

      if (inputs[ctx.status]) {
        await handleErrorWithSource("output", _joi.default.object(inputs[ctx.status]).validateAsync(ctx.body));
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

exports.default = _default;
//# sourceMappingURL=index.js.map