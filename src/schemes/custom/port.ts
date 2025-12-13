import {integer} from "../integer.js";

export type PortOpts = {
  excludeSystemPorts?: boolean
}

export function port(opts: PortOpts = {}) {
  const {excludeSystemPorts} = opts

  return integer({min: excludeSystemPorts ? 1025 : 0, max: 65535})
}