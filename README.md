# koa-validator

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
    "hello/:id",
    validate({
      query: {
        q: Joi.string().required()
      },
      params: {
        id: Joi.string().required()
      },
      headers:{
        'Content-Type': Joi.string().valid(["application/json", "application/javascript"])
      }
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
