import type {IndirectionExpression} from "./compiler.js";

export interface IndirectionEvaluator {
  /**
   * Evaluate the actual indirection.
   * You have to call `supports` to verify that the evaluator can
   * handle the given expression; otherwise it'll throw an error.
   *
   * @param indirection
   */
  evaluate(indirection: IndirectionExpression): Promise<unknown>

  /**
   * True if the given indirection expression is supported
   * by this evaluator.
   *
   * @param indirection
   */
  supports(indirection: IndirectionExpression): boolean
}

/**
 * This useful evaluator implementation allows us to compose
 * multiple evaluator.
 *
 * The final goal is to implement an evaluator per source.
 *
 * For each source, the evaluator's goal is to load the correct
 * configuration by understanding the expression's arguments.
 *
 * So, in the end, we'll have an evaluator for each source.
 * This implementation helps us to manage all the sources by loading
 * dispatching the expression on the right evaluator.
 */
export class OneOfEvaluator implements IndirectionEvaluator {
  #evaluators: IndirectionEvaluator[]

  constructor(evaluators: IndirectionEvaluator[]) {
    this.#evaluators = evaluators;
  }

  evaluate(indirection: IndirectionExpression): Promise<unknown> {
    for (const evaluator of this.#evaluators) {
      if (evaluator.supports(indirection)) {
        return evaluator.evaluate(indirection)
      }
    }

    throw new Error("No evaluator found for the given indirection")
  }

  supports(indirection: IndirectionExpression): boolean {
    return this.#evaluators.some(e => e.supports(indirection))
  }
}