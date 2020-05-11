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

const alternativeValidation = async (alternate, schema, values, config) => {
  let errorMsg = "";
  let _original = {};
  let details = [];

  for (const v in values) {
    try {
      await handleErrorWithSource(alternate, _joi.default.alternatives().try(_objectSpread({}, schema)).validateAsync(values[v], {
        allowUnknown: !config.denyUnknown.includes(v)
      }));
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
    if (source === "schema") {
      error.message = error.details[0].context.message || error.details[0].message;
    }

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
    schema,
    config
  } = inputs;

  if (config !== undefined && Object.prototype.toString.call(config) !== "[object Object]") {
    throw {
      message: `Route config, expecting config to be an Object`
    };
  }

  if (config && config.alternate && !Array.isArray(config.alternate)) {
    throw {
      message: `Config's alternate option should be an array`
    };
  }

  if (config && config.denyUnknown && !Array.isArray(config.denyUnknown)) {
    throw {
      message: `Config's denyUnknown option should be an array`
    };
  }

  if (schema && !_joi.default.isSchema(schema)) {
    throw {
      message: `Schema should be a Joi object`
    };
  }

  const _config = _objectSpread({
    denyUnknown: [],
    httpErrorCode: 400,
    nextOnError: false,
    alternate: []
  }, config);

  return async (ctx, next) => {
    let alternateSchema = {};
    let alternateData = {};

    if (_config.alternate.includes("query")) {
      alternateSchema = _objectSpread({
        query
      }, alternateSchema);
      alternateData = _objectSpread({
        query: {
          query: ctx.query
        }
      }, alternateData);
    }

    if (_config.alternate.includes("body")) {
      alternateSchema = _objectSpread({
        body
      }, alternateSchema);
      alternateData = _objectSpread({
        body: {
          body: ctx.request.body
        }
      }, alternateData);
    }

    if (_config.alternate.includes("params")) {
      alternateSchema = _objectSpread({
        params
      }, alternateSchema);
      alternateData = _objectSpread({
        params: {
          params: ctx.params
        }
      }, alternateData);
    }

    if (_config.alternate.includes("headers")) {
      alternateSchema = _objectSpread({
        headers
      }, alternateSchema);
      alternateData = _objectSpread({
        headers: {
          headers: ctx.headers
        }
      }, alternateData);
    }

    try {
      if (schema) {
        await handleErrorWithSource("schema", schema.validateAsync({
          query: ctx.query,
          body: ctx.request.body,
          params: ctx.params,
          headers: ctx.headers
        }));
      }

      if (query && !_config.alternate.includes("query")) {
        await handleErrorWithSource("query", _joi.default.object(query).unknown(!_config.denyUnknown.includes("query")).validateAsync(ctx.query));
      }

      if (params && !_config.alternate.includes("params")) {
        await handleErrorWithSource("params", _joi.default.object(params).validateAsync(ctx.params));
      }

      if (body && !_config.alternate.includes("body")) {
        await handleErrorWithSource("body", _joi.default.object(body).unknown(!_config.denyUnknown.includes("body")).validateAsync(ctx.request.body));
      }

      if (headers && !_config.alternate.includes("headers")) {
        const headersLowered = Object.keys(headers).reduce((destination, key) => {
          destination[key.toLowerCase()] = headers[key];
          return destination;
        }, {});
        await handleErrorWithSource("headers", _joi.default.object(headersLowered).unknown(!_config.denyUnknown.includes("headers")).validateAsync(ctx.headers));
      } // validation of alternates


      if (_config.alternate.length) {
        await alternativeValidation(_config.alternate, alternateSchema, alternateData, _config);
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