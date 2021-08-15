export function option (): string {
  return `
export class {{ name }} extends OptionEntity<{{ item }}> {
  {{>static-fns this}}

  static fromBuffer (buf?: Buffer): {{ name }} {
    if (buf == null) {
      return new {{ name }}()
    } else {
      {{#if (is-equal item 'Buffer')}}
        return new {{ name }}(buf)
      {{else}}
        return new {{ name }}({{ item }}.fromBuffer(buf))
      {{/if}}
    }
  }

  item: {{item}} | null

  constructor (item?: {{ item }}) {
    super()
    this.item = item == null ? null : item
  }

  toBuffer (): Buffer | null {
    {{#if (is-equal item 'Buffer')}}
      return this.item != null ? this.item : null
    {{else}}
      return this.item != null ? this.item.toBuffer() : null
    {{/if}}
  }

  toRawData (): Buffer | null {
    {{#if (is-equal item 'Buffer')}}
      return this.item != null ? this.item : null
    {{else}}
      return this.item != null ? this.item.toRawData() : null
    {{/if}}
  }

  toString (): string {
    return ''
  }

  isSome (): boolean {
    return this.item != null
  }

  isNone (): boolean {
    return this.item == null
  }
}`
}
