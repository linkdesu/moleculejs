import { expect } from 'chai'

import { ByteOpt, Byte3Opt, BytesOpt } from './generated-types/option'

describe('option', () => {
  describe('default', () => {
    it('should support decoding / encoding default', () => {
      // 0x
      const hex = ''
      const byte3OptDefault = Byte3Opt.fromBuffer()
      const byte3Opt = Byte3Opt.fromString(hex)

      expect(byte3OptDefault.isSome()).to.equal(false)
      expect(byte3OptDefault.isNone()).to.equal(true)
      expect(byte3Opt.isSome()).to.equal(false)
      expect(byte3Opt.isNone()).to.equal(true)
      expect(byte3OptDefault.toHex()).to.equal(hex)
      expect(byte3Opt.size).to.equal(0)
      expect(byte3OptDefault.size).to.equal(0)
    })
  })

  describe('fixed type', () => {
    // 0x111111
    const hex = '111111'
    const buf = Buffer.from(hex, 'hex')

    it('should support Buffer correctly', () => {
      const byte3Opt = Byte3Opt.fromBuffer()
      expect(byte3Opt.size).to.equal(0)

      const byteOpt = ByteOpt.fromBuffer()
      expect(byteOpt.size).to.equal(0)
    })

    it('should support serialize data', () => {
      const byte3Opt = Byte3Opt.fromString(hex)
      expect(byte3Opt.isSome()).to.equal(true)
      expect(byte3Opt.isNone()).to.equal(false)
      expect(byte3Opt.toBuffer()?.equals(buf)).to.equal(true)
      expect(byte3Opt.size).to.equal(3)
    })

    it('should support deserialize data', () => {
      const byte3Opt = Byte3Opt.fromString(hex)

      expect(byte3Opt.toBuffer()?.equals(buf)).to.equal(true)
      expect(byte3Opt.toRawData()?.equals(buf)).to.equal(true)
      expect(byte3Opt.toHex()).to.equal(hex)
    })
  })

  describe('dynamic type', () => {
    // 0x03000000112233
    const hex = '03000000112233'
    const buf = Buffer.from(hex, 'hex')

    it('should support serialize data', () => {
      const bytesOpt = BytesOpt.fromString(hex)
      expect(bytesOpt.isSome()).to.equal(true)
      expect(bytesOpt.isNone()).to.equal(false)
      expect(bytesOpt.toBuffer()?.equals(buf)).to.equal(true)
      expect(bytesOpt.size).to.equal(7)
    })

    it('should support deserialize data', () => {
      const bytesOpt = BytesOpt.fromString(hex)

      expect(bytesOpt.toBuffer()?.equals(buf)).to.equal(true)
      expect(bytesOpt.toRawData()?.equals(Buffer.from('112233', 'hex'))).to.equal(true)
      expect(bytesOpt.toHex()).to.equal(hex)
    })
  })
})
