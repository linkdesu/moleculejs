import { expect } from 'chai'

import { BytesOpt } from './generated-types/option'
import { BytesOptVec } from './generated-types/vector-opt'

describe('vector-opt', () => {
  describe('default', () => {
    it('should support decoding / encoding default', () => {
      // 0x04000000
      const hex = '04000000'
      const bytesOptVecDefault = BytesOptVec.fromBuffer()
      const bytesOptVec = BytesOptVec.fromString(hex)

      expect(bytesOptVec.equal(bytesOptVecDefault)).to.equal(true)
      expect(bytesOptVecDefault.toHex()).to.equal(hex)
      expect(bytesOptVec.size).to.equal(4)
      expect(bytesOptVecDefault.size).to.equal(4)
    })
  })

  describe('dynamic type', () => {
    /**
     0x25000000/10000000/17000000/1e000000//
       03000000//11/11/11
       03000000//22/22/22
       03000000//33/33/33
     */
    const hex = '2500000010000000170000001e000000030000001111110300000022222203000000333333'
    const buf = Buffer.from(hex, 'hex')

    it('should support encoding data', () => {
      const bytesOptVec = BytesOptVec.fromString(hex)
      expect(bytesOptVec.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support decoding data', () => {
      const bytesOptVec = BytesOptVec.fromString(hex)

      const items = bytesOptVec.items
      expect(items[0].equal(BytesOpt.fromString('03000000111111'))).to.equal(true)
      expect(items[1].equal(BytesOpt.fromString('03000000222222'))).to.equal(true)
      expect(items[2].equal(BytesOpt.fromString('03000000333333'))).to.equal(true)

      const buf = Buffer.from('030000001111110300000022222203000000333333', 'hex')
      expect(bytesOptVec.toRawData().equals(buf)).to.equal(true)

      expect(bytesOptVec.count).to.equal(3)
      expect(bytesOptVec.size).to.equal(37)
    })
  })
})
