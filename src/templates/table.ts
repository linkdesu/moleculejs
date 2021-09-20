export function table (): string {
  return `
export class {{ name }} extends Entity {
  {{>static-fns this}}

  static fromBuffer (buf?: Buffer): {{ name }} {
    if (buf == null) {
      {{{default-of-fields fields}}}
      return new {{ name }}(fields)
    }

    {{{table-of-fields 'buf' fields}}}
    return new {{ name }}(fields)
  }

  {{#each fields}}
  protected _{{ name }}: {{ type }}
  {{/each}}

  constructor ({{param-of-fields fields}}) {
    super()
    {{#each fields}}
    this._{{ name }} = {{ name }}
    {{/each}}
  }

  get count (): number {
    return {{ fields.length }}
  }

  get size (): number {
    const headerLength = uint32Length + uint32Length * {{ fields.length }}
    let bodyLength = 0
    {{#each fields}}
      {{#if (is-equal type 'Buffer')}}
        bodyLength += 1
      {{else}}
        bodyLength += this._{{ name }}.size
      {{/if}}
    {{/each}}
    return headerLength + bodyLength
  }

  get offsets (): number[] {
    let start = uint32Length * (1 + {{fields.length}})
    const offsets: number[] = []

    {{#each fields}}
    offsets.push(start)
      {{#if (is-equal type 'Buffer')}}
        start += 1
      {{else}}
        start += this._{{ name }}.size
      {{/if}}
    {{/each}}
    return offsets
  }

  {{#each fields}}
  get {{ name }} (): {{type}} {
    return this._{{ name }}
  }

  set {{ name }} (val: {{type}}) {
    this._{{ name }} = val
  }

  {{/each}}

  toBuffer (): Buffer {
    const header = Buffer.alloc(uint32Length * (1 + {{fields.length}}))
    header.writeUInt32LE(this.size)
    let start = uint32Length
    this.offsets.forEach(item => {
      header.writeUInt32LE(item, start)
      start += uint32Length
    })

    const bufs = []
    {{#each fields}}
      {{#if (is-equal type 'Buffer')}}
        bufs.push(this._{{ name }})
      {{else}}
        bufs.push(this._{{ name }}.toBuffer())
      {{/if}}
    {{/each}}

    {{#if (has-option-fields fields)}}
    return Buffer.concat([header, ...bufs.filter(item => item != null) as Buffer[]])
    {{else}}
    return Buffer.concat([header, ...bufs])
    {{/if}}
  }

  toRawData (): Buffer {
    const bufs = [
      {{#each fields}}
        {{#if (is-equal type 'Buffer')}}
          this._{{ name }},
        {{else}}
          this._{{ name }}.toBuffer(),
        {{/if}}
      {{/each}}
    ]

    {{#if (has-option-fields fields)}}
    return Buffer.concat(bufs.filter(item => item != null) as Buffer[])
    {{else}}
    return Buffer.concat(bufs)
    {{/if}}
  }

  toString (): string {
    return ''
  }

  equal (target: {{ name }}): boolean {
    return this.toBuffer().equals(target.toBuffer())
  }
}`
}
