import type {Clock} from "./clock.interface.js";

export class FakeClock implements Clock {
  #now: number

  constructor(now: number) {
    this.#now = now;
  }

  add(ms: number): FakeClock {
    this.#now += ms;
    return this;
  }

  now(): number {
    return this.#now;
  }
}