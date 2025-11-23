import {object} from "../../schemes2/object.js";
import {string} from "../../schemes2/string.js";
import {fatUnion} from "../../schemes2/fat-union.js";

export function vaultConfig() {
  return object({
    endpoint: string(),
    auth: fatUnion({
      token: string()
    })
  })
}