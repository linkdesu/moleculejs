import { expect } from 'chai'

import { StructA } from './generated-types/struct_'
import { Byte3 } from './generated-types/array'

describe('struct', () => {
  describe('default', () => {
    it('should support decoding / encoding default', () => {
      // 0x00/00/000000/000000
      const hex = '0000000000000000'
      const structADefault = StructA.fromBuffer()
      const structA = StructA.fromString(hex)

      expect(structA.equal(structADefault)).to.equal(true)
      expect(structADefault.toHex()).to.equal(hex)
    })
  })

  describe('fixed type', () => {
    // 0x01/02/111111/222222
    const hex = '0102111111222222'
    const buf = Buffer.from(hex, 'hex')

    it('should support decoding data', () => {
      const structA = StructA.fromString(hex)
      expect(structA.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support encoding data', () => {
      const structA = StructA.fromString(hex)

      expect(structA.count).to.equal(4)
      expect(structA.size).to.equal(8)

      expect(structA.f1.equals(Buffer.from('01', 'hex'))).to.equal(true)
      expect(structA.f2.equals(Buffer.from('02', 'hex'))).to.equal(true)
      expect(structA.f3.equal(Byte3.fromString('111111'))).to.equal(true)
      expect(structA.new_.equal(Byte3.fromString('222222'))).to.equal(true)

      expect(structA.toBuffer().equals(buf)).to.equal(true)
      expect(structA.toRawData().equals(buf)).to.equal(true)

      expect(structA.toHex()).to.equal(hex)
    })
  })
})
