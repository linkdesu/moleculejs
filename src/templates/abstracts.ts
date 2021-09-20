export function abstracts (): string {
  return `
import { Buffer } from 'buffer'

export abstract class Entity {
  abstract count: number
  abstract size: number

  abstract toBuffer (): Buffer
  abstract toRawData (): Buffer
  abstract toString (): string

  verify (buf: Buffer): boolean {
    return this.toBuffer().equals(buf)
  }

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

  verify (buf: Buffer): boolean {
    const current_buf = this.toBuffer()
    if (current_buf == null) {
      return false
    } else {
      return current_buf.equals(buf)
    }
  }

  toHex (): string {
    const buf = this.toBuffer()
    return buf != null ? buf.toString('hex') : ''
  }
}
`
}
