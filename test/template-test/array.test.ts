import { expect } from 'chai'

import { Byte3, Byte3x3 } from './generated-types/array'

describe('array', () => {
  describe('default', () => {
    it('should support decoding / encoding default', () => {
      const hex = '000000'
      const byte3Default = Byte3.fromBuffer()
      const byte3 = Byte3.fromString(hex)

      expect(byte3.equal(byte3Default)).to.equal(true)
      expect(byte3Default.toHex()).to.equal(hex)
    })
  })

  describe('byte', () => {
    // 0x01/02/03
    const hex = '010203'
    const buf = Buffer.from(hex, 'hex')

    it('should support decoding data', () => {
      const byte3 = Byte3.fromString(hex)
      expect(byte3.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support encoding data', () => {
      const byte3 = Byte3.fromString(hex)

      expect(byte3.items.equals(buf)).to.equal(true)

      expect(byte3.count).to.equal(3)
      expect(byte3.size).to.equal(3)
      expect(byte3.toBuffer().equals(buf)).to.equal(true)
      expect(byte3.toRawData().equals(buf)).to.equal(true)
      expect(byte3.toHex()).to.equal(hex)
    })
  })

  describe('fixed type', () => {
    // 0x010203/010203/010203
    const hex = '010203010203010203'
    const buf = Buffer.from(hex, 'hex')

    it('should support decoding data', () => {
      const byte3x3 = Byte3x3.fromString(hex)
      expect(byte3x3.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support encoding data', () => {
      const byte3x3 = Byte3x3.fromString(hex)

      const bufOfByte3 = Buffer.from('010203', 'hex')
      for (const item of byte3x3.items) {
        expect(item.items.equals(bufOfByte3)).to.equal(true)
      }

      expect(byte3x3.count).to.equal(3)
      expect(byte3x3.size).to.equal(9)
      expect(byte3x3.toBuffer().equals(buf)).to.equal(true)
      expect(byte3x3.toRawData().equals(buf)).to.equal(true)
      expect(byte3x3.toHex()).to.equal(hex)
    })
  })
})
