# koa-joi-validator

![npm](https://img.shields.io/npm/v/koa-io-validator)
![node](https://img.shields.io/node/v/koa-io-validator)
[![Build Status](https://travis-ci.org/fkanout/koa-validator.svg?branch=master)](https://travis-ci.org/fkanout/koa-validator)
[![codecov](https://codecov.io/gh/fkanout/koa-validator/branch/master/graph/badge.svg)](https://codecov.io/gh/fkanout/koa-validator)
[![Maintainability](https://api.codeclimate.com/v1/badges/8232d29278c06901cd50/maintainability)](https://codeclimate.com/github/fkanout/koa-validator/maintainability)
[![David deps](https://img.shields.io/david/fkanout/koa-validator.svg?style=flat)](https://codeclimate.com/github/fkanout/koa-validator)
[![Known Vulnerabilities](https://snyk.io/test/github/fkanout/koa-io-validator/badge.svg?targetFile=package.json)](https://snyk.io/test/github/fkanout/koa-io-validator?targetFile=package.json)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/koa-io-validator)
![NPM](https://img.shields.io/npm/l/koa-io-validator)

[![NPM](https://nodei.co/npm/koa-io-validator.png)](https://npmjs.org/package/koa-io-validator)

Koa input/output validation middleware

# Usage

```javascript
import Koa from "koa";
import Router from "@koa/router";
import validate from ('koa-validator');

import Joi from "@hapi/joi"; // Required

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
