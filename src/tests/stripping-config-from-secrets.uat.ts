import {describe, expect, it} from "vitest";
import {envSource} from "../sources/env/factory.js";
import {object} from "../schemes/object.js";
import {string} from "../schemes/string.js";
import {load} from "../load.js";
import {toLoggableConfig} from "../reporting/to-loggable-config.js";
import {origins} from "../sources/origin.js";
import {number} from "../schemes/number.js";
import {secret} from "../schemes/secret.js";
import {clearText} from "../schemes/clear-text.js";

describe.skip("stripping config from secrets", () => {
  it("should be able to strip secrets from config in order to log it", async () => {
    // Given
    const fakeEnvs = {MY_SECRET: "secret"}
    const source = envSource();
    const schema = object({
      mySecret: secret(string([source.alias("MY_SECRET")]))
    })

    // When
    const config = await load(schema, {inject: {envs: fakeEnvs}})
    const loggableConfig = toLoggableConfig(config)

    // Then
    expect(config).toEqual({
      mySecret: "secret",
      ...origins({ mySecret: "envs:MY_SECRET"})
    })
    expect(loggableConfig).toEqual({
      mySecret: 'REDACTED (envs:MY_SECRET)'
    })
  });

  it('should be able to mark properties of an object as secrets', async function () {
    // Given
    const fakeEnvs = {
      URL: 'http://localhost:3000',
      USERNAME: 'admin',
      PASSWORD: 'password'
    }
    const source = envSource();
    const schema = object({
      url: string([source.alias("URL")]),
      auth: secret(object({
        username: string([source.alias("USERNAME")]),
        password: string([source.alias("PASSWORD")])
      }))
    })

    // When
    const config = await load(schema, {inject: {envs: fakeEnvs}})
    const loggableConfig = toLoggableConfig(config)

    // Then
    expect(config).toEqual({
      url: 'http://localhost:3000',
      auth: {
        username: 'admin',
        password: 'password',
        ...origins({ username: "envs:USERNAME", password: "envs:PASSWORD" })
      },
      ...origins({ url: "envs:URL"})
    })
    expect(loggableConfig).toEqual({
      url: 'http://localhost:3000 (envs:URL)',
      auth: {
        username: 'REDACTED (envs:USERNAME)',
        password: 'REDACTED (envs:PASSWORD)'
      }
    })
  })

  it('should be able to revert disable secret redaction for a given entry', async function () {
    // Given
    const fakeEnvs = {
      URL: 'http://localhost:3000',
      USERNAME: 'admin',
      PASSWORD: 'password',
      RETRIES: "3"
    }
    const source = envSource();
    const schema = object({
      url: string([source.alias("URL")]),
      auth: secret(object({
        username: string([source.alias("USERNAME")]),
        password: string([source.alias("PASSWORD")]),
        retries: clearText(number([ source.alias("RETRIES") ]))
      }))
    })

    // When
    const config = await load(schema, {inject: {envs: fakeEnvs}})
    const loggableConfig = toLoggableConfig(config)

    // Then
    expect(config).toEqual({
      url: 'http://localhost:3000',
      auth: {
        username: 'admin',
        password: 'password',
        retries: 3,
        ...origins({ username: "envs:USERNAME", password: "envs:PASSWORD", retries: 'envs:RETRIES' })
      },
      ...origins({ url: "envs:URL"})
    })
    expect(loggableConfig).toEqual({
      url: 'http://localhost:3000 (envs:URL)',
      auth: {
        username: 'REDACTED (envs:USERNAME)',
        password: 'REDACTED (envs:PASSWORD)',
        retries: '3 (envs:RETRIES)'
      }
    })
  })
});
