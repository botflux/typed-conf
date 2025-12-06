import type {Alias} from "../../alias.js";

export function envAlias(env: string): Alias {
  return {
    source: 'envs',
    target: env
  }
}