import {describe, expect, it} from "vitest";
import {boolean} from "./boolean.js";
import Value from "typebox/value";
import {Object as TypeboxObject} from "typebox";
import {validate} from "../validation.js";
import {appendOrigin} from "../sources/origin.js";
import type {Alias, AnySourceType, Source} from "../sources/interfaces.js";

describe("boolean", () => {
  describe("type validation", () => {
    it("should throw given a non-boolean value", () => {
      // Given
      const schema = TypeboxObject({enabled: boolean().schema});
      const value = {enabled: 123};
      appendOrigin(value, "enabled", "env:ENABLED");

      // When
      const act = () => validate(schema, value);

      // Then
      expect(act).toThrow(
        new AggregateError([new Error("env:ENABLED must be boolean")]),
      );
    });
  });

  describe("default value", () => {
    it("should have no default value by default", () => {
      // Given
      const schema = boolean();

      // When
      const result = Value.Default(
        TypeboxObject({
          value: schema.schema,
        }),
        {},
      );

      // Then
      expect(result).toEqual({value: undefined});
    });

    it("should be able to configure a default value", () => {
      // Given
      const schema = boolean({default: true});

      // When
      const result = Value.Default(
        TypeboxObject({
          value: schema.schema,
        }),
        {},
      );

      // Then
      expect(result).toEqual({value: true});
    });
  });

  describe("aliases", () => {
    it('should be able to accept aliases as first argument', function () {
      // Given
      const alias: Alias<AnySourceType> = {source: "" as unknown as Source<AnySourceType>, aliasOpts: {}}

      // When
      const schema = boolean([alias])

      // Then
      expect(schema.structure).toEqual({
        kind: 'leaf',
        aliases: [alias]
      })
    })
  })
});
