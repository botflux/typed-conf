import type {IndirectionExpression} from "./compiler.js";

export interface IndirectionEvaluator {
  /**
   * Evaluate the actual indirection.
   * You have to call `supports` to verify that the evaluator can
   * handle the given expression; otherwise it'll throw an error.
   *
   * @param indirection
   * @param loaded
   */
  evaluate(indirection: IndirectionExpression, loaded: Record<string, unknown>): Promise<unknown>

  /**
   * True if the given indirection expression is supported
   * by this evaluator.
   *
   * @param indirection
   */
  supports(indirection: IndirectionExpression): boolean
}