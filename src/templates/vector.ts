export function vector (): string {
  return `
export class {{ name }} extends Entity {
  {{>static-fns this}}

  static fromBuffer (buf?: Buffer): {{ name }} {
    {{#if (is-equal type 'fixvec')}}
      if (buf != null && buf.length > uint32Length) {
        {{#if (is-equal item 'Buffer')}}
          return new {{ name }}(buf.slice(uint32Length))
        {{else}}
          const count = buf.slice(0, uint32Length).readUInt32LE()
          const items = []
          let start = uint32Length
          for (let i = 0; i < count; i++) {
            start = uint32Length + i * {{item}}.size
            items.push({{item}}.fromBuffer(buf.slice(start, start + {{item}}.size)))
          }
          return new {{ name }}(items)
        {{/if}}
      } else {
        {{#if (is-equal item 'Buffer')}}
          return new {{ name }}(Buffer.alloc(0))
        {{else}}
          return new {{ name }}([])
        {{/if}}
      }
    {{else}}
      if (buf != null && buf.length > uint32Length) {
        const firstItemOffset = buf.slice(uint32Length, uint32Length * 2).readUInt32LE()
        const offsets = buf.slice(uint32Length, firstItemOffset)
        const offsetsCount = offsets.length / uint32Length
        const items = []
        for (let i = 0; i < offsetsCount; i++) {
          const start = offsets.slice(i * uint32Length, (i + 1) * uint32Length).readUInt32LE()
          if (i + 1 >= offsetsCount) {
            items.push( {{item}}.fromBuffer(buf.slice(start)) )
          } else {
            const end = offsets.slice((i + 1) * uint32Length, (i + 2) * uint32Length).readUInt32LE()
            items.push( {{item}}.fromBuffer(buf.slice(start, end)) )
          }
        }
        return new {{ name }}(items)
      } else {
        return new {{ name }}([])
      }
    {{/if}}
  }

  protected readonly isDynamic: boolean
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
    {{#if (is-equal type 'fixvec')}}
      this.isDynamic = false
    {{else}}
      this.isDynamic = true
    {{/if}}
    this.items = items
  }

  get count (): number {
    return this.items.length
  }

  get size (): number {
    {{#if (is-equal type 'fixvec')}}
      {{#if (is-equal item 'Buffer')}}
        return uint32Length + this.items.length
      {{else}}
        return uint32Length + {{ item }}.size * this.items.length
      {{/if}}
    {{else}}
      return uint32Length + uint32Length * this.items.length + this.items.reduce((a, c) => a + c.size, 0)
    {{/if}}
  }

  get offsets (): number[] {
    {{#if (is-equal type 'fixvec')}}
      return []
    {{else}}
      let start = uint32Length * (1 + this.items.length)
      const offsets: number[] = []
      this.items.forEach(item => {
        offsets.push(start)
        start += item.size
      })
      return offsets
    {{/if}}
  }

  toBuffer (): Buffer {
    {{#if (is-equal type 'fixvec')}}
      const header = Buffer.alloc(uint32Length)
      header.writeUInt32LE(this.items.length)
      {{#if (is-equal item 'Buffer')}}
        return Buffer.concat([header, this.items])
      {{else}}
        const bufs = this.items.map(item => item.toBuffer())
        return Buffer.concat([header, ...bufs])
      {{/if}}
    {{else}}
      const header = Buffer.alloc(uint32Length * (1 + this.items.length))
      header.writeUInt32LE(this.size)
      let start = uint32Length
      this.offsets.forEach(item => {
        header.writeUInt32LE(item, start)
        start += uint32Length
      })

      {{#if (is-equal is_option true)}}
      const bufs = this.items.map(item => item.toBuffer()).filter(item => item != null) as Buffer[]
      {{else}}
      const bufs = this.items.map(item => item.toBuffer())
      {{/if}}
      return Buffer.concat([header, ...bufs])
    {{/if}}
  }

  toRawData (): Buffer {
    {{#if (is-equal type 'fixvec')}}
      {{#if (is-equal item 'Buffer')}}
        return this.items
      {{else}}
        const bufs = this.items.map(item => item.toBuffer())
        return Buffer.concat(bufs)
      {{/if}}
    {{else}}
      {{#if (is-equal is_option true)}}
      const bufs = this.items.map(item => item.toBuffer()).filter(item => item != null) as Buffer[]
      {{else}}
      const bufs = this.items.map(item => item.toBuffer())
      {{/if}}
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
