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

Koa input/output validation middleware for Koa router

# Usage

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
