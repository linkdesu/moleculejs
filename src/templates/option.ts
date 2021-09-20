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
        const entity = new {{ name }}({{ item }}.fromBuffer(buf))
        if (!entity.verify(buf)) {
          throw new Error('Invalid binary data')
        }
        return entity
      {{/if}}
    }
  }

  item: {{ item }} | null

  constructor (item?: {{ item }}) {
    super()
    this.item = item == null ? null : item
  }

  get size (): number {
    {{#if (is-equal item 'Buffer')}}
      return this.item != null ? this.item.length : 0
    {{else}}
      return this.item != null ? this.item.size : 0
    {{/if}}
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

  equal (target: {{ name }}): boolean {
    if (this.item == null || target.item == null) {
      return false
    } else {
      {{#if (is-equal item 'Buffer')}}
        return this.item.equals(target.item)
      {{else}}
        return this.item.equal(target.item)
      {{/if}}
    }
  }
}`
}
