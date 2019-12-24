const assert = require("assert");
const axios = require("axios");
const Router = require("@koa/router");
const validator = require("../lib").default;
const http = require("http");
const Joi = require("@hapi/joi");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const app = new Koa();

describe("Koa-Validator", function() {
  describe("QUERY", function() {
    before(async () => {
      const router = new Router();
      router.get("/test/1", async (ctx, next) => {
        ctx.body = {
          success: true
        };
        await next();
      });
      router.get("/test/2", validator({ query: { q: Joi.bool().required() } }), async (ctx, next) => {
        ctx.body = {
          success: true
        };
        await next();
      });

      app.use(router.routes());
      server = await new Promise((resolve, reject) => {
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
      const { status, data } = await axios("http://localhost:3001/test/2?q=true");
      assert.deepEqual(status, 200);
      assert.deepEqual(data.success, true);
    });
    after(() => {
      return new Promise((resolve, reject) => {
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
      server = await new Promise((resolve, reject) => {
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
        assert.deepEqual(error.response.data, `"valid" must be a positive number`);
      }
    });
    after(() => {
      return new Promise((resolve, reject) => {
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
      server = await new Promise((resolve, reject) => {
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
      return new Promise((resolve, reject) => {
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
      server = await new Promise((resolve, reject) => {
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
        assert.deepEqual(error.response.data, `"x-koa-validator" must be a boolean`);
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
      return new Promise((resolve, reject) => {
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
      server = await new Promise((resolve, reject) => {
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
        assert.deepEqual(error.response.data, `"x-koa-validator" must be a boolean`);
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
      return new Promise((resolve, reject) => {
        server.close(() => resolve());
      });
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
      app.use(bodyParser());
      app.use(router.routes());
      server = await new Promise((resolve, reject) => {
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
          headers: { "x-unknown-header": true, accept: "application/json", "content-type": "application/json" }
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
          headers: { "x-unknown-header": true, accept: "application/json", "content-type": "application/json" }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, `"x-unknown-header" is not allowed`);
      }
    });

    it("should fail when pass unknown body", async () => {
      try {
        await axios({
          method: "POST",
          url: "http://localhost:3001/config?q=string",
          data: { unknownBody: true, success: true },
          headers: { "x-unknown-header": true, accept: "application/json", "content-type": "application/json" }
        });
      } catch (error) {
        assert.deepEqual(error.response.status, 400);
        assert.deepEqual(error.response.data, `"unknownBody" is not allowed`);
      }
    });

    after(() => {
      return new Promise((resolve, reject) => {
        server.close(() => resolve());
      });
    });
  });
});
