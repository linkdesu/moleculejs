export function staticFns (): string {
  return `
static fromArray (arr: Uint8Array | number[]): {{ name }} {
  if (arr.length <= 0) {
    return {{ name }}.fromBuffer()
  } else {
    return {{ name }}.fromBuffer((Buffer.from(arr)))
  }
}

static fromString (hex: string, encoding: BufferEncoding = 'hex'): {{ name }} {
  if (hex === '') {
    return {{ name }}.fromBuffer()
  } else {
    return {{ name }}.fromBuffer((Buffer.from(hex, encoding)))
  }
}
`
}
