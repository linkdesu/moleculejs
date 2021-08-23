import { expect } from 'chai'
import { inspect } from 'util'

import * as util from '../src/util'

describe('util', () => {
  let ast: AST
  beforeEach(() => {
    ast = {
      namespace: 'compound',
      imports: [{ name: 'basic', paths: [], path_supers: 0 }],
      declarations: [
        {
          type: 'struct',
          name: 'StructA',
          fields: [
            { name: 'f1', type: 'byte' },
            { name: 'f2', type: 'byte' },
            { name: 'f3', type: 'Byte2' },
            { name: 'f4', type: 'Byte2' }
          ]
        },
        {
          type: 'table',
          name: 'TableA',
          fields: [
            { name: 'f1', type: 'byte' },
            { name: 'f2', type: 'byte' },
            { name: 'f3', type: 'Byte2' },
            { name: 'f4', type: 'Bytes' }
          ]
        },
        {
          type: 'union',
          name: 'UnionA',
          items: ['byte', 'Bytes', 'StructA', 'TableA']
        },
        {
          type: 'array',
          name: 'Byte2',
          item: 'byte',
          item_count: 2,
          imported_depth: 1
        },
        {
          type: 'array',
          name: 'Byte4',
          item: 'Byte2',
          item_count: 2,
          imported_depth: 1
        },
        { type: 'fixvec', name: 'Bytes', item: 'byte', imported_depth: 1 },
        {
          type: 'option',
          name: 'ByteOpt',
          item: 'byte',
          imported_depth: 1
        },
        {
          type: 'option',
          name: 'BytesOpt',
          item: 'Bytes',
          imported_depth: 1
        }
      ]
    }
  })

  describe('genExportsForAST', () => {
    it('should generate "exports" field for AST', () => {
      util.genExportsForAST([ast])
      expect(ast.exports).to.eql(['StructA', 'TableA', 'UnionA'])
    })
  })

  describe('improveTypeForToken', () => {
    const arrayToken: ArrayToken = { type: 'array', name: 'Byte2', item: 'byte', item_count: 2 }
    const vectorToken: VectorToken = { type: 'fixvec', name: 'Bytes', item: 'byte' }
    const optionToken: OptionToken = { type: 'option', name: 'ByteOpt', item: 'byte' }
    const structToken: StructToken = {
      type: 'struct',
      name: 'StructA',
      fields: [
        { name: 'f1', type: 'byte' },
        { name: 'f2', type: 'byte' },
        { name: 'f3', type: 'Byte2' },
        { name: 'f4', type: 'Byte2' },
        { name: 'new', type: 'Byte2' }
      ]
    }
    const tableToken: TableToken = {
      type: 'table',
      name: 'TableA',
      fields: [
        { name: 'f1', type: 'byte' },
        { name: 'f2', type: 'byte' },
        { name: 'f3', type: 'Byte2' },
        { name: 'f4', type: 'Bytes' },
        { name: 'function', type: 'Bytes' }
      ]
    }
    const unionToken: UnionToken = {
      type: 'union',
      name: 'UnionA',
      items: ['byte', 'Bytes', 'StructA', 'TableA']
    }

    it('should support array token', () => {
      util.improveTypeForToken(arrayToken)
      expect(arrayToken).to.eql({ type: 'array', name: 'Byte2', item: 'Buffer', item_count: 2 })
    })

    it('should support vector token', () => {
      util.improveTypeForToken(vectorToken)
      expect(vectorToken).to.eql({ type: 'fixvec', name: 'Bytes', item: 'Buffer' })
    })

    it('should support option token', () => {
      util.improveTypeForToken(optionToken)
      expect(optionToken).to.eql({ type: 'option', name: 'ByteOpt', item: 'Buffer' })
    })

    it('should support struct token', () => {
      util.improveTypeForToken(structToken)
      expect(structToken).to.eql({
        type: 'struct',
        name: 'StructA',
        fields: [
          { name: 'f1', type: 'Buffer' },
          { name: 'f2', type: 'Buffer' },
          { name: 'f3', type: 'Byte2' },
          { name: 'f4', type: 'Byte2' },
          { name: 'new_', type: 'Byte2' }
        ]
      })
    })

    it('should support table token', () => {
      util.improveTypeForToken(tableToken)
      expect(tableToken).to.eql({
        type: 'table',
        name: 'TableA',
        fields: [
          { name: 'f1', type: 'Buffer' },
          { name: 'f2', type: 'Buffer' },
          { name: 'f3', type: 'Byte2' },
          { name: 'f4', type: 'Bytes' },
          { name: 'function_', type: 'Bytes' }
        ]
      })
    })

    it('should support union token', () => {
      util.improveTypeForToken(unionToken)
      expect(unionToken).to.eql({
        type: 'union',
        name: 'UnionA',
        items: ['Buffer', 'Bytes', 'StructA', 'TableA']
      })
    })
  })

  describe('improveTypeForAST', () => {
    const trees: AST[] = [
      {
        namespace: 'struct',
        imports: [ { name: 'array', paths: [], path_supers: 0 } ],
        declarations: [
          {
            type: 'struct',
            name: 'StructA',
            fields: [
              { name: 'f1', type: 'byte' },
              { name: 'f2', type: 'byte' },
              { name: 'f3', type: 'Byte3' },
              { name: 'f4', type: 'Byte3' }
            ]
          },
          {
            type: 'array',
            name: 'Byte3',
            item: 'byte',
            item_count: 3,
            imported_depth: 1
          },
          {
            type: 'array',
            name: 'Byte3x3',
            item: 'Byte3',
            item_count: 3,
            imported_depth: 1
          }
        ]
      },
      {
        namespace: 'array',
        imports: [],
        declarations: [
          { type: 'array', name: 'Byte3', item: 'byte', item_count: 3 },
          { type: 'array', name: 'Byte3x3', item: 'Byte3', item_count: 3 }
        ]
      },
      {
        namespace: 'vector',
        imports: [ { name: 'array', paths: [], path_supers: 0 } ],
        declarations: [
          { type: 'fixvec', name: 'Bytes', item: 'byte' },
          { type: 'fixvec', name: 'Byte3Vec', item: 'Byte3' },
          { type: 'dynvec', name: 'BytesVec', item: 'Bytes' },
          { type: 'array', name: 'Byte3', item: 'byte', item_count: 3, imported_depth: 1 },
          { type: 'array', name: 'Byte3x3', item: 'Byte3', item_count: 3, imported_depth: 1 }
        ]
      },
      {
        namespace: 'option',
        imports: [ { name: 'vector', paths: [], path_supers: 0 } ],
        declarations: [
          { type: 'option', name: 'ByteOpt', item: 'byte' },
          { type: 'option', name: 'Byte3Opt', item: 'Byte3' },
          { type: 'option', name: 'BytesOpt', item: 'Bytes' },
          { type: 'fixvec', name: 'Bytes', item: 'byte', imported_depth: 1 },
          {
            type: 'fixvec',
            name: 'Byte3Vec',
            item: 'Byte3',
            imported_depth: 1
          },
          {
            type: 'dynvec',
            name: 'BytesVec',
            item: 'Bytes',
            imported_depth: 1
          },
          {
            type: 'array',
            name: 'Byte3',
            item: 'byte',
            item_count: 3,
            imported_depth: 1
          },
          {
            type: 'array',
            name: 'Byte3x3',
            item: 'Byte3',
            item_count: 3,
            imported_depth: 1
          }
        ]
      },
      {
        namespace: 'vector_opt',
        imports: [ { name: 'option', paths: [], path_supers: 0 } ],
        declarations: [
          { type: 'dynvec', name: 'BytesOptVec', item: 'BytesOpt' },
          { type: 'option', name: 'BytesOpt', item: 'Bytes', imported_depth: 1 }
        ]
      },
      {
        namespace: 'table_opt',
        imports: [ { name: 'option', paths: [], path_supers: 0 } ],
        declarations: [
          {
            type: 'table',
            name: 'TableA',
            fields: [
              { name: 'f1', type: 'byte' },
              { name: 'f2', type: 'ByteOpt' },
              { name: 'f3', type: 'Bytes' },
              { name: 'f4', type: 'BytesOpt' }
            ]
          },
          { type: 'option', name: 'ByteOpt', item: 'Bytes', imported_depth: 1 },
          { type: 'option', name: 'BytesOpt', item: 'Bytes', imported_depth: 1 }
        ]
      },
    ]

    it('should add fields for details of imported types', () => {
      util.improveTypeForAST(trees)
      expect(trees[2].imports[0].hasOwnProperty('types')).to.equal(true)
    })

    it('should only import types used', () => {
      util.improveTypeForAST(trees)
      expect(trees[2].imports[0]).to.eql({ name: 'array', paths: [], path_supers: 0, types: [ 'Byte3' ] })
    })

    it('should improve imports of structA correctly', () => {
      util.improveTypeForAST(trees)
      expect(trees[0].imports.length).to.gt(0)
    })

    it('should add option identifier to vector correctly', () => {
      util.improveTypeForAST(trees)
      expect(trees[4].declarations[0]).to.eql({ type: 'dynvec', name: 'BytesOptVec', item: 'BytesOpt', is_option: true })
    })

    it('should add option identifier to table correctly', () => {
      util.improveTypeForAST(trees)
      expect(trees[5].declarations[0]).to.eql({
        type: 'table',
        name: 'TableA',
        fields: [
          { name: 'f1', type: 'Buffer' },
          { name: 'f2', type: 'ByteOpt', is_option: true },
          { name: 'f3', type: 'Bytes' },
          { name: 'f4', type: 'BytesOpt', is_option: true }
        ]
      })
    })
  })
})
