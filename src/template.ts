import { camelCase, isNil } from 'lodash'
import * as Handlebars from 'handlebars'
import { inspect } from 'util'

import { BUFFER_TYPE, TPL_SYMBOL_NUM } from './const'
import { staticFns, namespace, abstracts, array, struct, vector, table, option } from './templates'

// Basic helpers
Handlebars.registerHelper('size-of', function (this: any, val: string) {
  // console.log('size-of:', this, val)
  switch (val) {
    case BUFFER_TYPE:
      return this.item_count
    case TPL_SYMBOL_NUM:
      return 4
    default:
      return `${this.item_count as string} * ${val}.size`
  }
})

Handlebars.registerHelper('param-of-fields', function (this: any, fields: TokenField[]) {
  // console.log('param-of-fields:', this, val)
  let variables = ''
  let comma = ''
  for (const field of fields) {
    variables += comma + `${field.name}`
    comma = ', '
  }
  let types = ''
  comma = ''
  for (const field of fields) {
    types += comma + `${field.name}: ${field.type}`
    comma = ', '
  }
  return `{ ${variables} }: { ${types} }`
})

/**
 * For struct only, will generate code like:
 *
 * ```typescript
 * 1 + 1 + Byte3.size + Byte3.size
 * ```
 */
Handlebars.registerHelper('struct-size-of-fields', function (this: any, val: TokenField[]) {
  // console.log('size-of:', this, val)
  let code = ''
  let plus = ''
  for (const field of val) {
    if (field.type === BUFFER_TYPE) {
      code += plus + '1'
    } else {
      code += plus + `${field.type}.size`
    }
    plus = ' + '
  }
  return code
})

/**
 * For struct only, will generate code like:
 *
 * ```typescript
 * const fields: any = {}
 * let offset = 0
 * fields.f1 = buf.slice(offset, offset + 1)
 * offset += 1
 * fields.f2 = buf.slice(offset, offset + 1)
 * offset += 1
 * fields.f3 = Byte3.fromBuffer(buf.slice(offset, offset + Byte3.size))
 * offset += Byte3.size
 * fields.f4 = Byte3.fromBuffer(buf.slice(offset, offset + Byte3.size))
 * offset += Byte3.size
 * ```
 */
Handlebars.registerHelper('struct-of-fields', function (this: any, bufName: string, fields: TokenField[]) {
  // console.log('object-of-fields:', this, val)
  let code = 'const fields: any = {}\n'
  code += 'let offset = 0\n'
  for (const field of fields) {
    if (field.type === 'Buffer') {
      code += `fields.${field.name} = ${bufName}.slice(offset, offset + 1)\n`
      code += 'offset += 1\n'
    } else {
      code += `fields.${field.name} = ${field.type}.fromBuffer(${bufName}.slice(offset, offset + ${field.type}.size))\n`
      code += `offset += ${field.type}.size\n`
    }
  }

  return code
})

/**
 * For table only, will generate code like:
 *
 * ```typescript
 * const fields: any = {}
 * fields.f1 = Buffer.alloc(1)
 * fields.f2 = Byte3.fromBuffer()
 * fields.f3 = Bytes.fromBuffer()
 * fields.f4 = StructA.fromBuffer()
 * ```
 */
Handlebars.registerHelper('default-of-fields', function (this: any, fields: TokenField[]) {
  // console.log('object-of-fields:', this, val)
  let code = 'const fields: any = {}\n'
  for (const field of fields) {
    if (field.type === 'Buffer') {
      code += `fields.${field.name} = Buffer.alloc(1)\n`
    } else {
      code += `fields.${field.name} = ${field.type}.fromBuffer()\n`
    }
  }

  return code
})

/**
 * For table only, will generate code like:
 *
 * ```typescript
 * const fields: any = {}
 * let start: number
 * let end: number
 * start = buf.slice(uint32Length * 1, uint32Length * 2).readUInt32LE()
 * end = buf.slice(uint32Length * 2, uint32Length * 3).readUInt32LE()
 * fields.f1 = buf.slice(start, end)
 * start = buf.slice(uint32Length * 2, uint32Length * 3).readUInt32LE()
 * end = buf.slice(uint32Length * 3, uint32Length * 4).readUInt32LE()
 * fields.f2 = Byte3.fromBuffer(buf.slice(start, end))
 * start = buf.slice(uint32Length * 3, uint32Length * 4).readUInt32LE()
 * end = buf.slice(uint32Length * 4, uint32Length * 5).readUInt32LE()
 * fields.f3 = Bytes.fromBuffer(buf.slice(start, end))
 * start = buf.slice(uint32Length * 4, uint32Length * 5).readUInt32LE()
 * end = buf.length
 * fields.f4 = StructA.fromBuffer(buf.slice(start, end))
 * ```
 */
Handlebars.registerHelper('table-of-fields', function (this: any, bufName: string, fields: TokenField[]) {
  // console.log('object-of-fields:', this, val)
  let code = 'const fields: any = {}\n'
  code += 'let start: number\n'
  code += 'let end: number\n'
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    code += `start = ${bufName}.slice(uint32Length * ${i + 1}, uint32Length * ${i + 2}).readUInt32LE()\n`
    if (i + 1 < fields.length) {
      code += `end = ${bufName}.slice(uint32Length * ${i + 2}, uint32Length * ${i + 3}).readUInt32LE()\n`
    } else {
      code += `end = ${bufName}.length\n`
    }
    if (field.type === 'Buffer') {
      code += `fields.${field.name} = end > start ? ${bufName}.slice(start, end) : Buffer.alloc(0)\n`
    } else {
      code += `fields.${field.name} = end > start ? ${field.type}.fromBuffer(buf.slice(start, end)) : ${field.type}.fromBuffer()\n`
    }
  }

  return code
})

Handlebars.registerHelper('has-option-fields', function (this: any, fields: TokenField[]) {
  // console.log('fields:', fields)
  for (const field of fields) {
    if (!isNil(field.is_option) && field.is_option) {
      return true
    }
  }
})

Handlebars.registerHelper('is-equal', function (this: any, exprA: any, exprB: any) {
  // console.log('is-equal:', this, exprA, exprB)
  return exprA === exprB
})

Handlebars.registerHelper('is-nil', function (val: any) {
  return isNil(val)
})

// Implement switch in template
Handlebars.registerHelper('switch', function (this: any, key: string, options) {
  this.switch_key = key
  this.switch_break = false
  return options.fn(this)
})
Handlebars.registerHelper('case', function (this: any, value, options) {
  if (this[this.switch_key] === value && !(this.switch_break as boolean)) {
    this.switch_break = true
    return options.fn(this)
  }
})
Handlebars.registerHelper('default', function (this: any, options) {
  if (!(this.switch_break as boolean)) {
    return options.fn(this)
  }
})

// Partials
Handlebars.registerPartial('static-fns', staticFns())
Handlebars.registerPartial('array', array())
Handlebars.registerPartial('struct', struct())
Handlebars.registerPartial('vector', vector())
Handlebars.registerPartial('table', table())
Handlebars.registerPartial('option', option())

export class Template {
  private readonly options = {
    strict: true
  }

  private readonly compiler = Handlebars.compile(namespace(), this.options)

  genAbstractsModule (): string {
    return abstracts()
  }

  genModule (ast: AST): string {
    console.log('Will compile ast:', inspect(ast, false, 4, true))
    return this.compiler(ast)
  }
}
