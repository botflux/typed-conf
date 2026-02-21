import {describe, expect, it} from "vitest";
import {load} from "../../load.js";
import {object} from "../../schemes/object.js";
import {string} from "../../schemes/string.js";
import {envSource} from "../../sources/env/factory.js";
import {number} from "../../schemes/number.js";
import {origins} from "../../sources/origin.js";

describe("load config from envs", () => {
  it("should load a string from an env variable", async () => {
    // Given
    const envs = envSource();

    const schema = object({
      host: string([envs.alias("HOST")]),
    });

    // When
    const config = await load(schema, {
      inject: {
        envs: {HOST: "localhost"},
      },
    });

    // Then
    expect(config).toEqual({host: "localhost"});
  });

  it("should be able to coerce envs", async () => {
    // Given
    const envs = envSource();

    const schema = object({
      port: number([envs.alias("PORT")]),
    });

    // When
    const config = await load(schema, {
      inject: {
        envs: {PORT: "3000"},
      },
    });

    // Then
    expect(config).toEqual({
      port: 3000,
      ...origins({ port: 'envs:PORT' })
    });
  });

  it("should be able to validate envs", async () => {
    // Given
    const envs = envSource();

    const schema = object({
      host: number([envs.alias("PORT")]),
    });

    // When
    const promise = load(schema, {
      inject: {
        envs: {PORT: "foo"},
      },
    });

    // Then
    await expect(promise).rejects.toThrow(new AggregateError([
      new Error("envs:PORT must be number"),
    ]));
  });
});
