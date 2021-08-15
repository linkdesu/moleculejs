export function array (): string {
  return `
export class {{ name }} extends Entity {
  static count: number = {{ item_count }}
  static size: number = {{size-of item}}

  {{>static-fns this}}

  static fromBuffer (buf?: Buffer): {{ name }} {
    if (buf == null) {
      buf = Buffer.alloc({{ name }}.size)
    }

    {{#if (is-equal item 'Buffer')}}
      return new {{ name }}(buf)
    {{else}}
      let items = []
      let start = 0
      for (let i = 0; i < {{ name }}.count; i++) {
        start = i * {{item}}.size
        items.push(new {{item}}(buf.slice(start, start + {{item}}.size)))
      }
      return new {{ name }}(items)
    {{/if}}
  }

  {{#switch 'item'}}
    {{#case 'Buffer'}} items: Buffer {{/case}}
    {{#default}} items: {{item}}[] {{/default}}
  {{/switch}}

  {{! Constructor }}
  {{#switch 'item'}}
    {{#case 'Buffer'}} constructor (items: Buffer) { {{/case}}
    {{#default}} constructor (items: {{ item }}[]) { {{/default}}
  {{/switch}}
    super()
    this.items = items
  }

  get count (): number {
    return {{ name }}.count
  }

  get size (): number {
    return {{ name }}.size
  }

  toBuffer (): Buffer {
    return this.toRawData()
  }

  toRawData (): Buffer {
    {{#if (is-equal item 'Buffer')}}
      return this.items
    {{else}}
      const bufs = this.items.map(item => item.toBuffer())
      return Buffer.concat(bufs)
    {{/if}}
  }

  toString (): string {
    return ''
  }

  equal (target: {{ name }}): boolean {
    {{#if (is-equal item 'Buffer')}}
      return this.items.equals(target.items)
    {{else}}
      return this.toRawData().equals(target.toRawData())
    {{/if}}
  }
}`
}
