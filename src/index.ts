import { Command, flags } from '@oclif/command'
import { isNil, isEmpty } from 'lodash'
import { promises as fs } from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { ESLint } from 'eslint'
import { inspect } from 'util'

import * as util from './util'
import { Template } from './template'

class MoleculeJS extends Command {
  static description = 'A typescript implementation for @nervosnetwork/molecule which is a compiler for serializing structured binary data on a blockchain named CKB.'
  static usage = 'moleculejs -i <path_of_json_inputs> -o <path_of_ts_outputs>'
  static examples = [
    '$ moleculejs -i das-types/schemas/ -o das-types/es/src/schemas/'
  ]

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    test: flags.boolean({ char: 't' }),
    moleculec: flags.string({ char: 'm', description: 'The absolute path of executable moleculec, if it not provided the internal binary will be used.' }),
    'input-dir': flags.string({ char: 'i', required: true, description: 'Specifies a directory which contains molecule schema files.' }),
    'output-package': flags.string({ char: 'p', exclusive: ['output-files'], description: 'Specifies a directory to store the generated typescript package.' }),
    'output-files': flags.string({ char: 'f', exclusive: ['output-package'], description: 'Specifies a directory to store the generated typescript files.' })
  }

  async run (): Promise<void> {
    try {
      const { flags } = this.parse(MoleculeJS)
      const moleculec = flags.moleculec ?? util.getMoleculec()
      const inputDir = flags['input-dir']
      const outputPackage = flags['output-package']
      const outputFiles = flags['output-files']

      if (flags.test) {
        // TODO improve testing hooks
        this.log = () => {}
      }

      // Find out every schema file in input directory and check if it is readable.
      const schemaFiles = []
      try {
        const files = await fs.readdir(inputDir)
        for (const file of files) {
          if (file.endsWith('.mol')) {
            schemaFiles.push(file)
          }
        }
      } catch (e) {
        this.error(e, { exit: 2 })
      }

      if (isEmpty(schemaFiles)) {
        this.error(`Can not find any molecule schema files in ${inputDir}, its name should be end with ".mol" suffix.`, { exit: 2 })
      }

      // Check if output directory is writable.
      if (!isNil(outputPackage)) {
        try {
          await util.isDirectoryWritable(outputPackage)
        } catch (e) {
          this.error(`Output directory is not writable: ${e.toString() as string}`, { exit: 3 })
        }
      } else if (!isNil(outputFiles)) {
        try {
          await util.isDirectoryWritable(outputFiles)
        } catch (e) {
          this.error(`Output directory is not writable: ${e.toString() as string}`, { exit: 3 })
        }
      } else {
        this.error('One of --output-package and output-files is required.', { exit: 3 })
      }

      // Parse every schema file to an object in special data structure.
      const tasks: Array<Promise<AST>> = []
      const template = new Template()
      for (const file of schemaFiles) {
        const task: Promise<AST> = new Promise((resolve, reject) => {
          const filepath = path.join(inputDir, file)
          exec(`${moleculec} --language - --schema-file ${filepath} --format json`, (err, stdout, stderr) => {
            if (!isNil(err)) {
              this.error('Failed on moleculec execution: ' + stderr, { exit: 4 })
            }

            // It is not a serious abstract syntax tree, but it is just like it, so I named it ast here.
            let ast: any
            try {
              ast = JSON.parse(stdout)
            } catch (e) {
              this.error(`Failed on parsing the return of moleculec: ${e.toString() as string}`, { exit: 4 })
            }

            this.log(`Compile file ${filepath} successfully!`)
            // console.log('Original ast:', inspect(ast, false, 4, true))

            resolve(ast)
          })
        })
        tasks.push(task)
      }

      const trees = await Promise.all(tasks)
      util.genExportsForAST(trees)
      util.improveTypeForAST(trees)

      this.log('Improve AST successfully!')
      // console.log('Improved asts:', inspect(trees, false, 4, true))

      const codes = [
        {
          filename: 'abstracts',
          code: template.genAbstractsModule()
        }
      ]
      for (const ast of trees) {
        codes.push({
          filename: ast.namespace,
          code: template.genModule(ast)
        })
      }

      // Initialize eslint for formatting generated codes
      const eslint = new ESLint({ fix: true, overrideConfigFile: path.join(path.dirname(__dirname), '.eslintrc.js') })

      if (!isNil(outputPackage)) {
        // TODO
      } else if (!isNil(outputFiles)) {
        for (const { filename, code } of codes) {
          const filepath = path.join(outputFiles, filename + '.ts')

          fs.writeFile(filepath, code)
            .then(async () => {
              // Format generated codes with eslint
              const results = await eslint.lintFiles(filepath)
              await ESLint.outputFixes(results)
            })
            .catch(err => {
              this.error(`Write code to file ${filepath} failed: ${err.toString() as string}`, { exit: 2 })
            })
        }
      }
    } catch (e) {
      if (isEmpty(this.argv) || (this.argv.length === 1 && this.argv.includes('-t'))) {
        this._help()
      } else {
        throw e
      }
    }
  }
}

export = MoleculeJS
