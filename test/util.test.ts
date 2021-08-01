import { expect } from 'chai'

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
        { name: 'f4', type: 'Byte2' }
      ]
    }
    const tableToken: TableToken = {
      type: 'table',
      name: 'TableA',
      fields: [
        { name: 'f1', type: 'byte' },
        { name: 'f2', type: 'byte' },
        { name: 'f3', type: 'Byte2' },
        { name: 'f4', type: 'Bytes' }
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
          { name: 'f4', type: 'Byte2' }
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
          { name: 'f4', type: 'Bytes' }
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
    const importedNamespace: AST = {
      namespace: 'basic',
      imports: [],
      declarations: [
        { type: 'array', name: 'Byte2', item: 'byte', item_count: 2 },
        { type: 'array', name: 'Byte4', item: 'Byte2', item_count: 2 },
        { type: 'fixvec', name: 'Bytes', item: 'byte' },
        { type: 'option', name: 'ByteOpt', item: 'byte' },
        { type: 'option', name: 'BytesOpt', item: 'Bytes' }
      ]
    }

    it('should add fields for details of imported types', () => {
      util.improveTypeForAST([importedNamespace, ast])
      expect(ast.imports[0]).to.eql({
        name: 'basic',
        paths: [],
        path_supers: 0,
        types: ['Byte2', 'Byte4', 'Bytes', 'ByteOpt', 'BytesOpt']
      })
    })
  })
})