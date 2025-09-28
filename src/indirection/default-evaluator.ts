import type {IndirectionExpression} from "./compiler.js";
import type {IndirectionEvaluator} from "./evaluator.js";

export type FunctionParameter = {
  name: string
  type: "string" | "number" | "boolean"
  required: boolean
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
      throw new Error(`Unknown function '${source}', available functions are: ${Array.from(this.#functions.keys()).join(", ")}`)
    }

    const functionArgs=  this.#extractArgs(mFunction, namedArgs, args)

    return mFunction.fn(functionArgs)
  }

  registerFunction(f: EvaluatorFunction): this {
    this.#functions.set(f.name, f)
    return this
  }

  #extractArgs(f: EvaluatorFunction, namedArgs: Record<string, string>, positionalArgs: string[]) {
    const hasPositional = positionalArgs.length > 0

    return hasPositional
      ? this.#getArgsFromPositional(f, positionalArgs)
      : this.#getArgsFromNamed(f, namedArgs)
  }

  #getArgsFromPositional(f: EvaluatorFunction, positionalArgs: string[]) {
    const requiredArgs = f.params.filter(p => p.required)

    if (positionalArgs.length !== requiredArgs.length) {
      throw new Error(`Function '${f.name}' expects ${requiredArgs.length} required parameter(s), got ${positionalArgs.length}.`)
    }

    return f.params.reduce((args, p, i) => {
      const param = positionalArgs[i]

      if (param === undefined && p.required) {
        throw new Error(`Parameter is not defined`)
      }

      return { ...args, [p.name]: param }
    }, {} as Record<string, string | undefined>)
  }

  #getArgsFromNamed(f: EvaluatorFunction, namedArgs: Record<string, string>) {
    return f.params.reduce((args: Record<string, string>, p)=> {
      const param = namedArgs[p.name]

      if (param === undefined) {
        throw new Error(`Named argument '${p.name}' is missing for function 'hello'`)
      }

      return { ...args, [p.name]: param }
    }, {} as Record<string, string>)
  }
}