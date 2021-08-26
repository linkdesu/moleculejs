import { expect } from 'chai'

import { TableA } from './generated-types/table'
import { Byte3 } from './generated-types/array'
import { Bytes } from './generated-types/vector'
import { StructA } from './generated-types/struct_'

describe('table', () => {
  describe('default', () => {
    it('should support decoding / encoding default', () => {
      // 0x24000000/14000000/15000000/18000000/1c000000//00/000000/00000000/0000000000000000
      const hex = '240000001400000015000000180000001c00000000000000000000000000000000000000'
      const tableADefault = TableA.fromBuffer()
      const tableA = TableA.fromString(hex)

      expect(tableA.equal(tableADefault)).to.equal(true)
      expect(tableADefault.toHex()).to.equal(hex)
    })
  })

  describe('dynamic type', () => {
    // 0x27000000/14000000/15000000/18000000/1f000000//01/111111/03000000112233/0102111111222222
    const hex = '270000001400000015000000180000001f00000001111111030000001122330102111111222222'
    const buf = Buffer.from(hex, 'hex')

    it('should support decoding data', () => {
      const tableA = TableA.fromString(hex)
      expect(tableA.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support encoding data', () => {
      const tableA = TableA.fromString(hex)

      expect(tableA.count).to.equal(4)
      expect(tableA.size).to.equal(39)

      expect(tableA.f1.equals(Buffer.from('01', 'hex'))).to.equal(true)
      expect(tableA.f2.equal(Byte3.fromString('111111'))).to.equal(true)
      expect(tableA.f3.equal(Bytes.fromString('03000000112233'))).to.equal(true)
      expect(tableA.function_.equal(StructA.fromString('0102111111222222'))).to.equal(true)

      const buf = Buffer.from('01111111030000001122330102111111222222', 'hex')
      expect(tableA.toRawData().equals(buf)).to.equal(true)

      expect(tableA.toHex()).to.equal(hex)
    })
  })
})
