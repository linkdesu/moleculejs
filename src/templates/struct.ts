export function struct (): string {
  return `
export class {{ name }} extends Entity {
  static count: number = {{ fields.length }}
  static size: number = {{struct-size-of-fields fields}}

  {{>static-fns this}}

  static fromBuffer (buf?: Buffer): {{ name }} {
    if (buf == null) {
      buf = Buffer.alloc({{ name }}.size)
    }

    {{{struct-of-fields 'buf' fields}}}

    const entity = new {{ name }}(fields)
    if (!entity.verify(buf)) {
      throw new Error('Invalid binary data')
    }
    return entity
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
    return {{ name }}.count
  }

  get size (): number {
    return {{ name }}.size
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
    return this.toRawData()
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

    return Buffer.concat(bufs)
  }

  toString (): string {
    return ''
  }

  equal (target: {{ name }}): boolean {
    return this.toRawData().equals(target.toRawData())
  }
}`
}
