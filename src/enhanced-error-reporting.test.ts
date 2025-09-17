import {describe, test} from "node:test";
import assert from "node:assert";
import {c} from "./loader.js";
import {envSource} from "./sources/envs.js";
import {fileSource, FakeFileSystem} from "./sources/files.js";

describe("Enhanced Error Reporting", () => {
  describe("Environment Source Errors", () => {
    test("should provide source context for integer validation errors", async () => {
      const configLoader = c.config({
        schema: c.object({
          port: c.integer()
        }),
        sources: [envSource()]
      });

      const mockEnv = { PORT: "foo" };

      await assert.rejects(
        () => configLoader.load({ sources: { envs: mockEnv } }),
        new Error("Expected 'PORT' (env) to be an integer, got 'foo'")
      );
    });

    test("should handle nested object validation errors", async () => {
      const configLoader = c.config({
        schema: c.object({
          database: c.object({
            port: c.integer()
          })
        }),
        sources: [envSource()]
      });

      const mockEnv = { DATABASE_PORT: "invalid" };

      await assert.rejects(
        () => configLoader.load({ sources: { envs: mockEnv } }),
        new Error("Expected 'DATABASE_PORT' (env) to be an integer, got 'invalid'")
      );
    });

    test("should handle boolean validation errors", async () => {
      const configLoader = c.config({
        schema: c.object({
          enabled: c.boolean()
        }),
        sources: [envSource()]
      });

      const mockEnv = { ENABLED: "maybe" };

      await assert.rejects(
        () => configLoader.load({ sources: { envs: mockEnv } }),
        new Error("Expected 'ENABLED' (env) to be a boolean, got 'maybe'")
      );
    });

    test("should handle float validation errors", async () => {
      const configLoader = c.config({
        schema: c.object({
          ratio: c.float()
        }),
        sources: [envSource()]
      });

      const mockEnv = { RATIO: "not-a-number" };

      await assert.rejects(
        () => configLoader.load({ sources: { envs: mockEnv } }),
        new Error("Expected 'RATIO' (env) to be a number, got 'not-a-number'")
      );
    });

    test("should handle env aliases in error messages", async () => {
      const configLoader = c.config({
        schema: c.object({
          port: c.integer().aliases({ id: "SERVER_PORT", sourceKey: "envs" })
        }),
        sources: [envSource()]
      });

      const mockEnv = { SERVER_PORT: "invalid" };

      await assert.rejects(
        () => configLoader.load({ sources: { envs: mockEnv } }),
        new Error("Expected 'SERVER_PORT' (env) to be an integer, got 'invalid'")
      );
    });

    test("should handle env prefix in error messages", async () => {
      const configLoader = c.config({
        schema: c.object({
          port: c.integer()
        }),
        sources: [envSource({ prefix: "APP_" })]
      });

      const mockEnv = { APP_PORT: "invalid" };

      await assert.rejects(
        () => configLoader.load({ sources: { envs: mockEnv } }),
        new Error("Expected 'APP_PORT' (env) to be an integer, got 'invalid'")
      );
    });
  });

  describe("File Source Errors", () => {
    test("should provide source context for file validation errors", async () => {
      const fakeFs = new FakeFileSystem()
        .addFile("/config.json", JSON.stringify({
          port: "invalid"
        }));

      const configLoader = c.config({
        schema: c.object({
          port: c.integer()
        }),
        sources: [fileSource({ file: "/config.json" })]
      });

      await assert.rejects(
        () => configLoader.load({ sources: { file: { fs: fakeFs } } }),
        new Error("Expected 'port' (file) to be an integer, got 'invalid'")
      );
    });

    test("should handle nested file properties in error messages", async () => {
      const fakeFs = new FakeFileSystem()
        .addFile("/config.json", JSON.stringify({
          database: {
            port: "invalid"
          }
        }));

      const configLoader = c.config({
        schema: c.object({
          database: c.object({
            port: c.integer()
          })
        }),
        sources: [fileSource({ file: "/config.json" })]
      });

      await assert.rejects(
        () => configLoader.load({ sources: { file: { fs: fakeFs } } }),
        new Error("Expected 'database.port' (file) to be an integer, got 'invalid'")
      );
    });

    test("should handle primitive values at root level", async () => {
      const fakeFs = new FakeFileSystem()
        .addFile("/config.json", JSON.stringify({
          enabled: "not-boolean"
        }));

      const configLoader = c.config({
        schema: c.object({
          enabled: c.boolean()
        }),
        sources: [fileSource({ file: "/config.json" })]
      });

      await assert.rejects(
        () => configLoader.load({ sources: { file: { fs: fakeFs } } }),
        new Error("Expected 'enabled' (file) to be a boolean, got 'not-boolean'")
      );
    });
  });

  describe("Multiple Sources", () => {
    test("should show correct source when env overrides file", async () => {
      const fakeFs = new FakeFileSystem()
        .addFile("/config.json", JSON.stringify({
          port: 3000
        }));

      const configLoader = c.config({
        schema: c.object({
          port: c.integer()
        }),
        sources: [
          fileSource({ file: "/config.json" }),
          envSource()
        ]
      });

      const mockEnv = { PORT: "invalid" };

      await assert.rejects(
        () => configLoader.load({
          sources: { 
            file: { fs: fakeFs },
            envs: mockEnv 
          }
        }),
        new Error("Expected 'PORT' (env) to be an integer, got 'invalid'")
      );
    });

    test("should show file source when env is not provided", async () => {
      const fakeFs = new FakeFileSystem()
        .addFile("/config.json", JSON.stringify({
          port: "invalid"
        }));

      const configLoader = c.config({
        schema: c.object({
          port: c.integer()
        }),
        sources: [
          fileSource({ file: "/config.json" }),
          envSource()
        ]
      });

      await assert.rejects(
        () => configLoader.load({
          sources: { 
            file: { fs: fakeFs },
            envs: {} 
          }
        }),
        new Error("Expected 'port' (file) to be an integer, got 'invalid'")
      );
    });
  });

  describe("Edge Cases", () => {
    test("should handle missing source metadata gracefully", async () => {
      const configLoader = c.config({
        schema: c.object({
          port: c.integer()
        }),
        sources: [envSource()]
      });

      // Test with empty env to ensure no values are loaded
      await assert.rejects(
        () => configLoader.load({ sources: { envs: {} } }),
        Error
      );
    });

    test("should preserve quotes in error messages when they are part of the value", async () => {
      const configLoader = c.config({
        schema: c.object({
          port: c.integer()
        }),
        sources: [envSource()]
      });

      const mockEnv = { PORT: '"not-a-number"' };

      await assert.rejects(
        () => configLoader.load({ sources: { envs: mockEnv } }),
        new Error('Expected \'PORT\' (env) to be an integer, got \'"not-a-number"\'')
      );
    });
  });
});