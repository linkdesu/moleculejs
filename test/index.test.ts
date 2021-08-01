import { expect } from 'chai'

import cmd = require('../src')

describe('moleculejs', () => {
  const levels = ['log', 'debug', 'info', 'warn', 'error']
  // @ts-expect-error
  const originalFunctions = levels.map(level => console[level])
  beforeEach(function () {
    levels.forEach(level => {
      // @ts-expect-error
      console[level] = () => {}
    })
  })

  afterEach(function () {
    levels.forEach((level, i) => {
      // @ts-expect-error
      console[level] = originalFunctions[i]
    })
  })

  it('run without args', async () => {
    try {
      await cmd.run(['-t'])
    } catch (e) {
      expect(e.oclif?.exit).to.equal(0)
    }
  })

  it('run -i <a_directory_without_schema_files>', async function () {
    try {
      await cmd.run(['-t', '-i', './'])
    } catch (e) {
      expect(e.oclif?.exit).to.equal(2)
    }
  })

  it('run -i ./test/template-test/schema/', async function () {
    try {
      await cmd.run(['-t', '-i', './test/template-test/schema/'])
    } catch (e) {
      expect(e.oclif?.exit).to.equal(3)
    }
  })

  it('run -i ./test/template-test/schema/ -f test/template-test/generated-types/', async function () {
    await cmd.run(['-t', '-i', './test/template-test/schema/', '-f', 'test/template-test/generated-types/'])
    expect(true).to.equal(true)
  })
})
