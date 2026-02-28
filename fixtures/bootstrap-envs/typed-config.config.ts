import { object } from '../../src/schemes/object.js'
import { number } from '../../src/schemes/number.js'

const schema = object({ foo: number() })

export default {
  schema,
}