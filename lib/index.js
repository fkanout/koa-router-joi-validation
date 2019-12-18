"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _joi = _interopRequireDefault(require("@hapi/joi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = function _default(inputs) {
  return function _callee(ctx, next) {
    var query, params, body, headers, headersLowered;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            query = inputs.query, params = inputs.params, body = inputs.body, headers = inputs.headers;

            if (!query) {
              _context.next = 5;
              break;
            }

            _context.next = 5;
            return regeneratorRuntime.awrap(_joi["default"].object(query).validateAsync(ctx.query));

          case 5:
            if (!params) {
              _context.next = 8;
              break;
            }

            _context.next = 8;
            return regeneratorRuntime.awrap(_joi["default"].object(params).validateAsync(ctx.params));

          case 8:
            if (!body) {
              _context.next = 11;
              break;
            }

            _context.next = 11;
            return regeneratorRuntime.awrap(_joi["default"].object(body).validateAsync(ctx.request.body));

          case 11:
            if (!headers) {
              _context.next = 15;
              break;
            }

            // the framework make the headers entries lowercase-ed, so Joi schema should lowercase as well to match.
            headersLowered = Object.keys(headers).reduce(function (destination, key) {
              destination[key.toLowerCase()] = headers[key];
              return destination;
            }, {});
            _context.next = 15;
            return regeneratorRuntime.awrap(_joi["default"].object(headersLowered).unknown(true) // Allow unchecked headers entries to be sent.
            .validateAsync(ctx.headers));

          case 15:
            _context.next = 17;
            return regeneratorRuntime.awrap(next());

          case 17:
            if (!inputs[ctx.status]) {
              _context.next = 20;
              break;
            }

            _context.next = 20;
            return regeneratorRuntime.awrap(_joi["default"].object(inputs[ctx.status]).validateAsync(ctx.body));

          case 20:
            _context.next = 25;
            break;

          case 22:
            _context.prev = 22;
            _context.t0 = _context["catch"](0);
            ctx["throw"](400, _context.t0);

          case 25:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[0, 22]]);
  };
};

exports["default"] = _default;
//# sourceMappingURL=index.js.map