import type {InjectOpts, LoadOpts} from './types.js'
import {describe, it, expectTypeOf} from 'vitest'
import type {SourceType} from "./sources/interfaces.js";

describe('InjectOpts', function () {
  it('should be able to map a list of sources to their inject options', function () {
    // Given
    type SourceAType = SourceType<"envs", unknown, unknown, { someDependency: string }>
    type SourceBType = SourceType<"file", unknown, unknown, { anotherDependency: string }>

    // When
    type Result = InjectOpts<[SourceAType, SourceBType]>

    // Then
    expectTypeOf<Result>().toEqualTypeOf<{ envs: { someDependency: string }, file: { anotherDependency: string } }>()
  })

  it('should be able to make a source\'s inject opts nullable given it contains only nullable properties', function () {
    // Given
    type SourceAType = SourceType<"envs", unknown, unknown, { someDependency?: string }>
    type SourceBType = SourceType<"file", unknown, unknown, { anotherDependency: string }>

    // When
    type Result = InjectOpts<[SourceAType, SourceBType]>

    // Then
    expectTypeOf<Result>().toEqualTypeOf<{ envs?: { someDependency?: string }; file: { anotherDependency: string } }>()
  })
})

describe('LoadOpts', function () {
  it('should have the the inject opts of each source', function () {
    // Given
    type SourceAType = SourceType<"envs", unknown, unknown, { someDependency: string }>
    type SourceBType = SourceType<"file", unknown, unknown, { anotherDependency: string }>

    // When
    type Result = LoadOpts<[SourceAType, SourceBType]>

    // Then
    expectTypeOf<Result>().toEqualTypeOf<{
      inject: { envs: { someDependency: string }, file: { anotherDependency: string } }
    }>()
  })

  it('should be able to make nullable the inject opts nullable given all the sources\' injection opts are nullable', function () {
    // Given
    type SourceAType = SourceType<"envs", unknown, unknown, { someDependency?: string }>
    type SourceBType = SourceType<"file", unknown, unknown, { anotherDependency?: string }>

    // When
    type Result = LoadOpts<[SourceAType, SourceBType]>

    // Then
    expectTypeOf<Result>().toEqualTypeOf<{
      inject?: { envs?: { someDependency?: string }, file?: { anotherDependency?: string } }
    }>()
  })
})