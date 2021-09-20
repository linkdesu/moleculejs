export function abstracts (): string {
  return `
import { Buffer } from 'buffer'

export abstract class Entity {
  abstract count: number
  abstract size: number

  abstract toBuffer (): Buffer
  abstract toRawData (): Buffer
  abstract toString (): string

  toHex (): string {
    return this.toBuffer().toString('hex')
  }
}

export abstract class OptionEntity<T> {
  abstract item: T | null

  abstract toBuffer (): Buffer | null
  abstract toRawData (): Buffer | null
  abstract toString (): string
  abstract isSome (): boolean
  abstract isNone (): boolean

  toHex (): string {
    const buf = this.toBuffer()
    return buf != null ? buf.toString('hex') : ''
  }
}
`
}
