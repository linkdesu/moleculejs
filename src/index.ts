import { Command, flags } from '@oclif/command'
import { isNil, isEmpty, isNumber } from 'lodash'
import { promises as fs } from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
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
    moleculec: flags.string({ char: 'm', description: 'The path of executable moleculec, if it not provided the internal binary will be used.' }),
    'input-dir': flags.string({ char: 'i', required: true, description: 'Specifies a directory which contains molecule schema files.' }),
    'output-package': flags.string({ char: 'p', exclusive: ['output-files'], description: 'Specifies a directory to store the generated typescript package.' }),
    'output-files': flags.string({ char: 'f', exclusive: ['output-package'], description: 'Specifies a directory to store the generated typescript files.' })
  }

  async run (): Promise<void> {
    const { flags } = this.parse(MoleculeJS)

    const moleculec = flags.moleculec ?? util.getMoleculec()
    const inputDir = flags['input-dir']
    const outputPackage = flags['output-package']
    const outputFiles = flags['output-files']

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
        this.error(`Output directory is not writable: ${e.toString()}`, { exit: 1 })
      }
    } else if (!isNil(outputFiles)) {
      try {
        await util.isDirectoryWritable(outputFiles)
      } catch (e) {
        this.error(`Output directory is not writable: ${e.toString()}`, { exit: 1 })
      }
    } else {
      this.error('One of --output-package and output-files is required.', { exit: 1 })
    }

    // Parse every schema file to an object in special data structure.
    const tasks: Array<Promise<AST>> = []
    const template = new Template()
    for (const file of schemaFiles) {
      const task: Promise<AST> = new Promise((resolve, reject) => {
        const filepath = path.join(inputDir, file)
        exec(`${moleculec} --language - --schema-file ${filepath} --format json`, (err, stdout, stderr) => {
          if (!isNil(err)) {
            this.error('Failed on moleculec execution: ' + stderr, { exit: 3 })
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

    // Generate exports information of abstract-syntax-tree
    for (const ast of trees) {
      ast.exports = []
      for (const token of ast.declarations) {
        if (isNil(token.imported_depth)) {
          ast.exports.push(token.name)
        }
      }
    }

    // Improve type information in imports field.
    for (const ast of trees) {
      const tokenToRemove: number[] = []
      const importedTypes: string[] = []
      // Find out imported types and add it to related namespace.
      ast.declarations.forEach((token, i) => {
        if (isNumber(token.imported_depth) && token.imported_depth > 0) {
          importedTypes.push(token.name)
          tokenToRemove.push(i)
        }
      })

      const importedTypesGroups = util.groupImportTypesBySource(trees, ast.namespace, importedTypes)
      for (const _import of ast.imports) {
        if (Object.prototype.hasOwnProperty.call(importedTypesGroups, _import.name)) {
          _import.types = importedTypesGroups[_import.name]
        }
      }

      // Remove imported types from current tree.
      tokenToRemove.forEach(tokenIndex => {
        ast.declarations.splice(tokenIndex, 1)
      })

      // console.log('Improved ast:', inspect(ast, false, 4, true))
    }

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

    if (!isNil(outputPackage)) {
      // TODO
    } else if (!isNil(outputFiles)) {
      for (const { filename, code } of codes) {
        const filepath = path.join(outputFiles, filename + '.ts')
        fs.writeFile(filepath, code).catch(err => {
          this.error(`Write code to file ${filepath} failed: ${err.toString() as string}`, { exit: 2 })
        })
      }
    }
  }
}

export = MoleculeJS
