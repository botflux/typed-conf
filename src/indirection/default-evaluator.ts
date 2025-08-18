import type {IndirectionExpression} from "./compiler.js";
import type {IndirectionEvaluator} from "./evaluator.js";

export type FunctionParameter = {
  name: string
  type: "string" | "number" | "boolean"
}

export type EvaluatorFunction = {
  name: string
  params: FunctionParameter[]
  fn: (args: Record<string, unknown>) => unknown | Promise<unknown>
}

export class DefaultEvaluator implements IndirectionEvaluator {
  #functions = new Map<string, EvaluatorFunction>()

  async evaluate(indirection: IndirectionExpression, loaded: Record<string, unknown>): Promise<unknown> {
    const { source, namedArgs = {}, args } = indirection
    const mFunction = this.#functions.get(source)

    if (mFunction === undefined) {
      throw new Error(`Unknown function '${source}', available functions are '${Array.from(this.#functions.keys())}'`)
    }

    const functionArgs=  this.#extractArgs(mFunction, namedArgs, args)

    return mFunction.fn(functionArgs)
  }

  registerFunction(f: EvaluatorFunction) {
    this.#functions.set(f.name, f)
  }

  supports(indirection: IndirectionExpression): boolean {
    return true
  }

  #extractArgs(f: EvaluatorFunction, namedArgs: Record<string, string>, positionalArgs: string[]) {
    const hasPositional = positionalArgs.length > 0

    return hasPositional
      ? this.#getArgsFromPositional(f, positionalArgs)
      : this.#getArgsFromNamed(f, namedArgs)
  }

  #getArgsFromPositional(f: EvaluatorFunction, positionalArgs: string[]) {
    if (positionalArgs.length !== f.params.length) {
      throw new Error(`Function '${f.name}' expects ${f.params.length} parameter(s) but received ${positionalArgs.length} parameter(s).`)
    }

    return f.params.reduce((args, p, i) => {
      const param = positionalArgs[i]

      if (param === undefined) {
        throw new Error(`Parameter is not defined`)
      }

      return { ...args, [p.name]: param }
    }, {} as Record<string, string>)
  }

  #getArgsFromNamed(f: EvaluatorFunction, namedArgs: Record<string, string>) {
    return f.params.reduce((args: Record<string, string>, p)=> {
      const param = namedArgs[p.name]

      if (param === undefined) {
        throw new Error("Parameter is not defined")
      }

      return { ...args, [p.name]: param }
    }, {} as Record<string, string>)
  }
}