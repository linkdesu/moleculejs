import { expect } from 'chai'

import { Bytes } from './generated-types/vector'
import { ByteOpt, BytesOpt } from './generated-types/option'
import { TableAOpt } from './generated-types/table-opt'
import { Byte3 } from './generated-types/array'
import { StructA } from './generated-types/struct_'

describe('table-opt', () => {
  describe('default', () => {
    it('should support decoding / encoding default', () => {
      /**
       * 0x19000000/14000000/15000000/15000000/19000000//
       *   00/00000000
       */
      const hex = '19000000140000001500000015000000190000000000000000'
      const tableAOpt = TableAOpt.fromString(hex)
      const tableAOptDefault = TableAOpt.fromBuffer()

      expect(tableAOpt.equal(tableAOptDefault)).to.equal(true)
      expect(tableAOptDefault.toHex()).to.equal(hex)

      expect(tableAOpt.f1.equals(Buffer.from([0]))).to.equal(true)
      expect(tableAOpt.f2.item).to.equal(null)
      expect(tableAOpt.f3.equal(Bytes.fromBuffer())).to.equal(true)
      expect(tableAOpt.f4.item).to.equal(null)
    })
  })

  describe('dynamic type', () => {
    /**
     * 0x24000000/14000000/15000000/16000000/1d000000//
     *   01/
     *   11/
     *   03000000//11/22/33
     *   03000000//11/11/11
     */
    const hex = '240000001400000015000000160000001d00000001110300000011223303000000111111'
    const buf = Buffer.from(hex, 'hex')

    it('should support encoding data', () => {
      const tableAOpt = TableAOpt.fromString(hex)
      expect(tableAOpt.toBuffer().equals(buf)).to.equal(true)
    })

    it('should support decoding data', () => {
      const tableAOpt = TableAOpt.fromString(hex)

      expect(tableAOpt.count).to.equal(4)
      expect(tableAOpt.size).to.equal(36)

      expect(tableAOpt.f1.equals(Buffer.from([1]))).to.equal(true)
      expect(tableAOpt.f2.equal(ByteOpt.fromString('11'))).to.equal(true)
      expect(tableAOpt.f3.equal(Bytes.fromString('03000000112233'))).to.equal(true)
      expect(tableAOpt.f4.equal(BytesOpt.fromString('03000000111111'))).to.equal(true)

      const buf = Buffer.from('01110300000011223303000000111111', 'hex')
      expect(tableAOpt.toRawData().equals(buf)).to.equal(true)

      expect(tableAOpt.toHex()).to.equal(hex)
    })
  })
})
