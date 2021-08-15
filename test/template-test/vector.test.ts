import { expect } from 'chai'

import { Byte3 } from './generated-types/array'
import { Bytes, Byte3Vec, BytesVec } from './generated-types/vector'

describe('vector', () => {
  describe('default', () => {
    it('should support decoding / encoding default', () => {
      // 0x00000000
      const hex = '00000000'
      const structADefault = Bytes.fromBuffer()
      const structA = Bytes.fromString(hex)

      expect(structA.equal(structADefault)).to.equal(true)
      expect(structADefault.toHex()).to.equal(hex)
    })
  })

  describe('byte', () => {
    // 0x03000000//11/22/33
    const hex = '03000000112233'
    const buf = Buffer.from(hex, 'hex')

    it('should support decoding data', () => {
      const bytes = Bytes.fromString(hex)
      expect(bytes.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support encoding data', () => {
      const bytes = Bytes.fromString(hex)

      const buf = Buffer.from('112233', 'hex')
      expect(bytes.items.equals(buf)).to.equal(true)
      expect(bytes.toRawData().equals(buf)).to.equal(true)

      expect(bytes.count).to.equal(3)
      expect(bytes.size).to.equal(7)
    })
  })

  describe('fixed types', () => {
    // 0x03000000//000000/111111/222222
    const hex = '03000000000000111111222222'
    const buf = Buffer.from(hex, 'hex')

    it('should support decoding data', () => {
      const byte3s = Byte3Vec.fromString(hex)
      expect(byte3s.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support encoding data', () => {
      const byte3s = Byte3Vec.fromString(hex)

      const items = byte3s.items
      expect(items[0].equal(Byte3.fromString('000000'))).to.equal(true)
      expect(items[1].equal(Byte3.fromString('111111'))).to.equal(true)
      expect(items[2].equal(Byte3.fromString('222222'))).to.equal(true)

      const buf = Buffer.from('000000111111222222', 'hex')
      expect(byte3s.toRawData().equals(buf)).to.equal(true)

      expect(byte3s.count).to.equal(3)
      expect(byte3s.size).to.equal(13)
    })
  })

  describe('dynamic type', () => {
    /**
     0x1a000000/0c000000/13000000//
       03000000//11/22/33
       03000000//11/22/33
     */
    const hex = '1a0000000c000000130000000300000011223303000000112233'
    const buf = Buffer.from(hex, 'hex')

    it('should support encoding data', () => {
      const bytesVec = BytesVec.fromString(hex)
      expect(bytesVec.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support decoding data', () => {
      const bytesVec = BytesVec.fromString(hex)

      const items = bytesVec.items
      expect(items[0].equal(Bytes.fromString('03000000112233'))).to.equal(true)
      expect(items[1].equal(Bytes.fromString('03000000112233'))).to.equal(true)

      const buf = Buffer.from('0300000011223303000000112233', 'hex')
      expect(bytesVec.toRawData().equals(buf)).to.equal(true)

      expect(bytesVec.count).to.equal(2)
      expect(bytesVec.size).to.equal(26)
    })
  })
})
