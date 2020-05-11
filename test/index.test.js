const assert = require("assert");
const axios = require("axios");
const Router = require("@koa/router");
const validator = require("../lib").default;
const http = require("http");
const Joi = require("@hapi/joi");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const app = new Koa();

let server;
let _server;

describe("koa-router-joi-validation", function() {
  describe("QUERY", function() {
    before(async () => {
      const router = new Router();
      router.get("/test/1", async (ctx, next) => {
        ctx.body = {
          success: true
        };
        await next();
      });
      router.get(
        "/test/2",
        validator({ query: { q: Joi.bool().required() } }),
        async (ctx, next) => {
          ctx.body = {
            success: true
          };
          await next();
        }
      );

      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });
    it("should pass to route handler when no schema is defined", async () => {
      const { status, data } = await axios("http://localhost:3001/test/1");
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    it("should fail when query string is not provided", async () => {
      try {
        await axios("http://localhost:3001/test/2");
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, `"q" is required`);
      }
    });
    it("should fail when the schema mismatch passed query string", async () => {
      try {
        await axios("http://localhost:3001/test/2?q=1");
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, `"q" must be a boolean`);
      }
    });
    it("should pass to route handler when the schema does match passed query string", async () => {
      const { status, data } = await axios(
        "http://localhost:3001/test/2?q=true"
      );
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });
    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });

  describe("PARAMS", async () => {
    before(async () => {
      const router = new Router();
      router.get("/params/:valid", async (ctx, next) => {
        ctx.body = {
          success: true
        };
        await next();
      });
      router.get(
        "/params/:valid",
        validator({
          params: {
            valid: Joi.number()
              .integer()
              .positive()
              .required()
          }
        }),
        async (ctx, next) => {
          ctx.body = {
            success: true
          };
          await next();
        }
      );
      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });
    it("should pass to route handler when no schema is defined", async () => {
      const { status, data } = await axios("http://localhost:3001/params/200");
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });
    it("should fail when the schema mismatch passed params", async () => {
      try {
        await axios("http://localhost:3001/params/-200");
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          `"valid" must be a positive number`
        );
      }
    });
    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });
  describe("BODY", async () => {
    before(async () => {
      const router = new Router();
      router.post("/body", async (ctx, next) => {
        ctx.body = ctx.request.body;
        await next();
      });
      router.post(
        "/body/validator",
        validator({
          body: {
            success: Joi.bool().required()
          }
        }),
        async (ctx, next) => {
          ctx.body = ctx.request.body;
          await next();
        }
      );
      app.use(bodyParser());
      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });

    it("should pass to route handler when no schema is defined", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/body",
        data: { test: "test" },
        headers: { "Content-Type": "application/json" }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.test, "test");
    });

    it("should fail when schema is defined and not body is passed", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/body/validator",
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, `"success" is required`);
      }
    });
    it("should pass to route handler when schema matchs request body", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/body/validator",
        data: { success: true },
        headers: { "Content-Type": "application/json" }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });

  describe("HEADERS", async () => {
    before(async () => {
      const router = new Router();
      router.get("/headers", async (ctx, next) => {
        ctx.body = {
          success: true
        };
        await next();
      });
      router.get(
        "/headers/validator",
        validator({
          headers: {
            "x-koa-validator": Joi.bool().required()
          }
        }),
        async (ctx, next) => {
          ctx.body = {
            success: true
          };
          await next();
        }
      );
      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });

    it("should pass to route handler when no schema is defined", async () => {
      const { status, data } = await axios({
        method: "GET",
        url: "http://localhost:3001/headers"
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    it("should fail when schema is mismatch the headers", async () => {
      try {
        await axios({
          method: "GET",
          url: "http://localhost:3001/headers/validator",
          headers: { "x-koa-validator": 123 }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          `"x-koa-validator" must be a boolean`
        );
      }
    });

    it("should pass to route handler when schema matchs request headers", async () => {
      const { status, data } = await axios({
        method: "GET",
        url: "http://localhost:3001/headers/validator",
        data: { success: true },
        headers: { "x-koa-validator": true }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });

  describe("[OUTPUT]", async () => {
    before(async () => {
      const router = new Router();
      router.get("/output", async (ctx, next) => {
        ctx.body = {
          success: true
        };
        await next();
      });
      router.get(
        "/output/validator",
        validator({
          200: {
            success: Joi.boolean().required()
          }
        }),
        async (ctx, next) => {
          ctx.body = {
            success: "true"
          };
          await next();
        }
      );
      router.get(
        "/output/validator/done",
        validator({
          200: {
            success: Joi.boolean().required()
          }
        }),
        async (ctx, next) => {
          ctx.body = {
            success: true
          };
          await next();
        }
      );

      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });

    it("should pass to route handler when no schema is defined", async () => {
      const { status, data } = await axios({
        method: "GET",
        url: "http://localhost:3001/output"
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    it("should fail when schema is mismatch the the output", async () => {
      try {
        await axios({
          method: "GET",
          url: "http://localhost:3001/output/validator"
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          `"x-koa-validator" must be a boolean`
        );
      }
    });

    it("should pass to route handler when schema matchs request returned response", async () => {
      const { status, data } = await axios({
        method: "GET",
        url: "http://localhost:3001/output/validator/done"
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });

  describe("[SCHEMA]", async () => {
    before(async () => {
      const router = new Router();
      router.post(
        "/test/schema/query",
        validator({
          schema: Joi.object({
            query: Joi.object({
              q: Joi.boolean().required()
            })
          }).unknown(true)
        }),
        async (ctx, next) => {
          ctx.body = {
            success: true
          };
          await next();
        }
      );
      router.post(
        "/test/schema/body",
        validator({
          schema: Joi.object({
            body: Joi.object({
              id: Joi.string().required()
            })
          }).unknown(true)
        }),
        async (ctx, next) => {
          ctx.body = {
            success: true
          };
          await next();
        }
      );
      router.post(
        "/test/schema/complex",
        validator({
          schema: Joi.alternatives().try(
            Joi.object({
              query: Joi.object({
                q1: Joi.boolean().required()
              })
            }).unknown(true),
            Joi.object({
              query: Joi.object({
                q2: Joi.boolean()
              }),
              body: Joi.object({
                ids: Joi.array()
                  .min(1)
                  .required()
              }).required()
            }).unknown(true)
          )
        }),
        async (ctx, next) => {
          ctx.body = {
            success: true
          };
          await next();
        }
      );

      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });

    it("should fail when pass unknown query", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/test/schema/query?unknown=true",
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, '"query.q" is required');
      }
    });

    it("should fail when pass incorrect query", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/test/schema/query?q=notBoolean",
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, '"query.q" must be a boolean');
      }
    });

    it("should succeed when query is correct", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/test/schema/query?q=true",
        headers: {
          "x-unknown-header": true,
          accept: "application/json",
          "content-type": "application/json"
        }
      });

      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    it("should fail when pass unknown body", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/test/schema/body",
          data: { unknown: true },
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, '"body.id" is required');
      }
    });

    it("should fail when pass incorrect body", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/test/schema/body",
          data: { id: 2 },
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, '"body.id" must be a string');
      }
    });

    it("should succeed when body is correct", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/test/schema/body",
        data: { id: "correctString" },
        headers: {
          "x-unknown-header": true,
          accept: "application/json",
          "content-type": "application/json"
        }
      });

      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    it("should fail when complex schema fails - query case", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/test/schema/complex?unknown=true",
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          '"query.q1" is required. "query.unknown" is not allowed'
        );
      }
    });

    it("should fail when complex schema fails - quary and body case", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/test/schema/complex?q2=true",
          data: {
            unknown: "data"
          },
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          '"query.q1" is required. "body.ids" is required'
        );
      }
    });

    it("should succeed when complex schema is correct - query case", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/test/schema/complex?q1=true",
        headers: {
          "x-unknown-header": true,
          accept: "application/json",
          "content-type": "application/json"
        }
      });

      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    it("should succeed when complex schema is correct - query and body case", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/test/schema/complex?q2=true",
        data: {
          ids: ["id1", "id2"]
        },
        headers: {
          "x-unknown-header": true,
          accept: "application/json",
          "content-type": "application/json"
        }
      });

      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });

    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });

  describe("[SCHEMA] incorrect initialization", () => {
    it("Should throw an error if schema is not a compiled joi schema", async () => {
      try {
        const router = new Router();
        router.post(
          "/schema",
          validator({
            schema: {
              // Plain JS Object - not a compiled joi schema
            }
          }),
          async (ctx, next) => {
            ctx.body = {
              success: "true"
            };
            await next();
          }
        );
        app.use(bodyParser());
        app.use(router.routes());
        server = await new Promise(resolve => {
          _server = http.createServer(app.callback());
          _server.listen(3001, () => resolve(_server));
        });
      } catch (error) {
        assert.ok(error);
        assert.deepEqual(error.message, "Schema should be a Joi object");
      }
    });

    it("Should throw an error if config's denyUnknown is not an array", async () => {
      try {
        const router = new Router();
        router.post(
          "/config",
          validator({
            config: {
              denyUnknown: "notAnArray"
            }
          }),
          async (ctx, next) => {
            ctx.body = {
              success: "true"
            };
            await next();
          }
        );
        app.use(bodyParser());
        app.use(router.routes());
        server = await new Promise(resolve => {
          _server = http.createServer(app.callback());
          _server.listen(3001, () => resolve(_server));
        });
      } catch (error) {
        assert.ok(error);
        assert.deepEqual(
          error.message,
          "Config's denyUnknown option should be an array"
        );
      }
    });
  });

  describe("[CONFIG]", async () => {
    before(async () => {
      const router = new Router();
      router.post(
        "/config",
        validator({
          query: {
            q: Joi.string().required()
          },
          headers: {
            accept: Joi.string().required(),
            "content-type": Joi.string().required()
          },
          body: {
            success: Joi.bool().required()
          },
          200: {
            success: Joi.boolean().required()
          },
          config: {
            denyUnknown: ["query", "headers", "body"]
          }
        }),
        async (ctx, next) => {
          ctx.body = {
            success: "true"
          };
          await next();
        }
      );
      router.get(
        "/config/next/input",
        validator({
          query: {
            q: Joi.string().required()
          },
          config: {
            nextOnError: true
          }
        }),
        async ctx => {
          ctx.body = ctx.state.routeValidationError;
        }
      );
      router.get(
        "/config/next/output",
        validator({
          200: {
            success: Joi.bool().required()
          },
          config: {
            nextOnError: true
          }
        }),
        async ctx => {
          ctx.body = {
            success: "string"
          };
        }
      );

      app.use(bodyParser());
      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });

    it("should fail when pass unknown query", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/config?q=string&unknown=hi",
          data: { success: true },
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, `"unknown" is not allowed`);
      }
    });

    it("should fail when pass unknown header", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/config?q=string",
          data: { success: true },
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          `"x-unknown-header" is not allowed`
        );
      }
    });

    it("should fail when pass unknown body", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/config?q=string",
          data: { unknownBody: true, success: true },
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, `"unknownBody" is not allowed`);
      }
    });
    it("should fail without throw an 400. Error should be in 'ctx.state.routeValidationError' - INPUT'", async () => {
      const { status, data } = await axios(
        "http://localhost:3001/config/next/input"
      );

      assert.deepEqual(status, 200);
      assert.deepEqual(data.details[0].message, '"q" is required');
    });
    it("should fail without throw an 400. Error should be in 'ctx.state.routeValidationError' - OUTPUT", async () => {
      const { status, data } = await axios(
        "http://localhost:3001/config/next/output"
      );
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, "string");
    });

    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });

  describe("[CONFIG] incorrect initialization", () => {
    it("Should throw an error if config's alternate is not an array", async () => {
      try {
        const router = new Router();
        router.post(
          "/config",
          validator({
            config: {
              alternate: "notAnArray"
            }
          }),
          async (ctx, next) => {
            ctx.body = {
              success: "true"
            };
            await next();
          }
        );
        app.use(bodyParser());
        app.use(router.routes());
        server = await new Promise(resolve => {
          _server = http.createServer(app.callback());
          _server.listen(3001, () => resolve(_server));
        });
      } catch (error) {
        assert.ok(error);
        assert.deepEqual(
          error.message,
          "Config's alternate option should be an array"
        );
      }
    });

    it("Should throw an error if config's denyUnknown is not an array", async () => {
      try {
        const router = new Router();
        router.post(
          "/config",
          validator({
            config: {
              denyUnknown: "notAnArray"
            }
          }),
          async (ctx, next) => {
            ctx.body = {
              success: "true"
            };
            await next();
          }
        );
        app.use(bodyParser());
        app.use(router.routes());
        server = await new Promise(resolve => {
          _server = http.createServer(app.callback());
          _server.listen(3001, () => resolve(_server));
        });
      } catch (error) {
        assert.ok(error);
        assert.deepEqual(
          error.message,
          "Config's denyUnknown option should be an array"
        );
      }
    });
  });

  describe("[CONFIG] alternate", async () => {
    before(async () => {
      const router = new Router();
      router.post(
        "/alternate",
        validator({
          query: {
            q: Joi.string().required()
          },
          headers: {
            accept: Joi.string().required(),
            "content-type": Joi.string().required()
          },
          body: {
            success: Joi.boolean().required()
          },
          200: {
            success: Joi.boolean().required()
          },
          config: {
            alternate: ["query", "body"]
          }
        }),
        async (ctx, next) => {
          ctx.body = {
            success: "true"
          };
          await next();
        }
      );
      router.get(
        "/alternate/next/:valid",
        validator({
          params: {
            valid: Joi.number()
              .integer()
              .positive()
              .required()
          },
          headers: {
            accept: Joi.string().required(),
            "content-type": Joi.string().required()
          },
          config: {
            alternate: ["headers", "params"]
          }
        }),
        async ctx => {
          ctx.body = {
            success: "true"
          };
        }
      );

      app.use(bodyParser());
      app.use(router.routes());
      server = await new Promise(resolve => {
        _server = http.createServer(app.callback());
        _server.listen(3001, () => resolve(_server));
      });
    });

    it("should fail when neither body and query params are passed correctly", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/alternate?unknown=hi",
          data: { unknown: true },
          headers: {
            "x-unknown-header": true,
            accept: "application/json",
            "content-type": "application/json"
          }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          '"body.success" is required; "query.q" is required;'
        );
      }
    });

    it("should succeed when query is correct", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/alternate?q=hi",
        data: { unknown: true },
        headers: {
          "x-unknown-header": true,
          accept: "application/json",
          "content-type": "application/json"
        }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, "true");
    });

    it("should succeed when body is correct", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/alternate?unknown=hi",
        data: { success: true },
        headers: {
          "x-unknown-header": true,
          accept: "application/json",
          "content-type": "application/json"
        }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, "true");
    });

    it("should succeed when both body and query are correct", async () => {
      const { status, data } = await axios({
        method: "POST",
        url: "http://localhost:3001/alternate?q=hi",
        data: { success: true },
        headers: {
          "x-unknown-header": true,
          accept: "application/json",
          "content-type": "application/json"
        }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, "true");
    });

    it("should fail when neither params and headers are passed correctly", async () => {
      try {
        await axios({
          method: "GET",
          url: "http://localhost:3001/alternate/next/notStringValue",
          headers: { "x-unknown-header": true }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(
          error.response.data,
          '"headers.content-type" is required; "params.valid" must be a number;'
        );
      }
    });

    it("should succeed when params is correct", async () => {
      const { status, data } = await axios({
        method: "GET",
        url: "http://localhost:3001/alternate/next/10",
        headers: {}
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, "true");
    });

    it("should succeed when headers is correct", async () => {
      const { status, data } = await axios({
        method: "GET",
        url: "http://localhost:3001/alternate/next/-1",
        headers: { "content-type": "someContentType" }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, "true");
    });

    it("should succeed when both headers and params are correct", async () => {
      const { status, data } = await axios({
        method: "GET",
        url: "http://localhost:3001/alternate/next/1",
        headers: { "content-type": "someContentType" }
      });
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, "true");
    });

    after(() => {
      return new Promise(resolve => {
        server.close(() => resolve());
      });
    });
  });

  describe("[CONFIG-RUNTIME]", () => {
    it("should throw an error at runtime when config is not an object", async () => {
      try {
        const router = new Router();
        router.get(
          "/config/wrongConfig",
          validator({
            200: {
              success: Joi.boolean().required()
            },
            config: ["wrongConfigType"]
          }),
          async (ctx, next) => {
            ctx.body = {
              success: "true"
            };
            await next();
          }
        );
        app.use(bodyParser());
        app.use(router.routes());
        server = await new Promise(resolve => {
          _server = http.createServer(app.callback());
          _server.listen(3001, () => resolve(_server));
        });
      } catch (error) {
        assert.deepEqual(
          error.message,
          "Route config, expecting config to be an Object"
        );
      }
    });
  });
});
