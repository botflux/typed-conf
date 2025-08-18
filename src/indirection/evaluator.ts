import type {IndirectionExpression} from "./compiler.js";

export interface IndirectionEvaluator {
  /**
   * Evaluate the actual indirection.
   *
   * @param indirection
   * @param loaded
   */
  evaluate(indirection: IndirectionExpression, loaded: Record<string, unknown>): Promise<unknown>
}