# koa-router-joi-validation

![npm](https://img.shields.io/npm/v/koa-router-joi-validation)
![node](https://img.shields.io/node/v/koa-router-joi-validation)
[![Build Status](https://travis-ci.org/fkanout/koa-router-joi-validation.svg?branch=master)](https://travis-ci.org/fkanout/koa-router-joi-validation)
[![codecov](https://codecov.io/gh/fkanout/koa-router-joi-validation/branch/master/graph/badge.svg)](https://codecov.io/gh/fkanout/koa-router-joi-validation)
[![Maintainability](https://api.codeclimate.com/v1/badges/067dde32d2ff6107cc68/maintainability)](https://codeclimate.com/github/fkanout/koa-router-joi-validation/maintainability)
[![David deps](https://img.shields.io/david/fkanout/koa-router-joi-validation.svg?style=flat)](https://codeclimate.com/github/fkanout/koa-router-joi-validation)
[![Known Vulnerabilities](https://snyk.io/test/github/fkanout/koa-router-joi-validation/badge.svg?targetFile=package.json)](https://snyk.io/test/github/fkanout/koa-router-joi-validation?targetFile=package.json)
![NPM](https://img.shields.io/npm/l/koa-router-joi-validation)

[![NPM](https://nodei.co/npm/koa-router-joi-validation.png)](https://npmjs.org/package/koa-router-joi-validation)

⚡️Super Light, configurable Koa router validator middleware that uses [Joi](https://www.npmjs.com/package/@hapi/joi).⚡️

# Install

`npm install koa-router-joi-validation -S`

# Why

- It uses [Joi](https://www.npmjs.com/package/@hapi/joi) (_The most powerful schema description language and data validator for JavaScript._)
- Input validation (`query`, `params`, `body`, `headers`).
- Output validation, based on the HTTP returned code from the router `200`, `204` ...etc.
- Configurable.
- It does only one thing (**validation**) and it does it right.
- Loose coupling with `koa-router`, means:
  - Built-for `koa-router` and NOT [`koa-router` Built-in].
  - Standard routes function signature.
  - Clean changelog and No unnecessary updates (it always concerns the package itself).
  - Always have access to `await next()`.
  - Tiny codebase.
- **100%** 🔥 test coverage.

# Usage

The middleware function takes an object as argument

```javascript
import validate, { Joi } from ('koa-router-joi-validation');
.....
    validate({
      query: // Joi schema object
      body: // Joi schema object
      params: // Joi schema object
      headers: // Joi schema object
      200: // Joi schema object
      503: // Joi schema object
      .....
      config: {
        denyUnknown: [],
        httpErrorCode: 400,
        nextOnError: false,
        alternate: []
      }
    }),
.....
```

# `validate(object)`

## The object contains the next keys:

| Key      |       Type        | Validates          | Note                                                                                     |
| -------- | :---------------: | ------------------ | ---------------------------------------------------------------------------------------- |
| query    | Joi Schema Object | `ctx.query`        |                                                                                          |
| params   | Joi Schema Object | `ctx.params`       |                                                                                          |
| headers  | Joi Schema Object | `ctx.headers`      |                                                                                          |
| body     | Joi Schema Object | `ctx.request.body` | ⚠️ use a body parser e.g. [koa-bodyparser](https://www.npmjs.com/package/koa-bodyparser) |
| 200..503 | Joi SchemaObject  | `ctx.body`         | when `ctx.status` === 200..503                                                           |
| config   |      Object       |                    | Use it to change the validator behavior:                                                 |

## `config`

- `denyUnknown`

  allow/disallow undeclared values in the schema

  **Type** `array`.

  **default** [].

  e.g. `denyUnknown["headers"]` the request fail ONLY if all the headers entries are declared in schema.

#

- `httpErrorCode`

  The returned http error code when the validation fails

  **Type** `int` HTTP code (`400`... `503`)

  **default** `400` (Bad request)

#

- `nextOnError`

  If `true`, the validator will not throw an error and the execution flow will continue (`await next()`)

  ⚠️ Note: in that case the validation error will be found in `ctx.state.routeValidationError`

  **Type** `bool`

  **default** `false`

#

- `alternate`

  Allows alternative validation in the schema. It is a wrapper of Joi's [alternatives](https://hapi.dev/module/joi/api/?v=17.1.1#alternatives) function.

  **Type** `array`.

  **default** [].

  e.g. `alternate["body", "query"]` alternative validation will be applied on the request's `query` and `body` parameters. The request fails if both are incorrect. If any parameter from the list succeed the validation, request will pass and continue the execution flow.

# Example

```javascript
import Koa from "koa";
import Router from "@koa/router";
import validate, { Joi } from ('koa-router-joi-validation');

const app = new Koa();
const router = new Router()

router.get(
    "/hello/:id",
    validate({
      query: {
        q: Joi.string().required()
      },
      params: {
        id: Joi.string().required()
      },
      headers: {
        "Content-Type": Joi.string()
          .valid("application/json", "application/javascript")
          .required()
      },
      200: {
        succuss: Joi.bool()
      }
    }),
    async (ctx, next) => {
      ctx.body = {
        succuss: true
      };
      await next();
    }
  );

app.use(router.routes());
```

# Licences

### [MIT](https://github.com/fkanout/koa-router-joi-validation/blob/master/LICENSE)
