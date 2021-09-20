import { Command, flags } from '@oclif/command'
import { isNil, isEmpty } from 'lodash'
import { promises as fs } from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import * as download from 'download'
import * as ora from 'ora'
// @ts-ignore
import * as prettier from 'prettierx'
// import { inspect } from 'util'

import * as util from './util'
import { Template } from './template'

class MoleculeJS extends Command {
  static description = 'A typescript implementation for @nervosnetwork/molecule which is a compiler for serializing structured binary data on a blockchain named CKB.'
  static usage = '-i <path_of_schema_inputs> -f <path_of_ts_outputs>'
  static examples = [
    '$ moleculejs -i das-types/schemas/ -f das-types/es/src/schemas/'
  ]

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    test: flags.boolean({ char: 't', description: 'Turn on test mode for unit tests.' }),
    download: flags.boolean({ char: 'd', description: 'Download the prebuilt moleculec binary base on your platform.' }),
    'download-from': flags.string({ description: 'Download the prebuilt moleculec binary base on your platform.' }),
    moleculec: flags.string({ char: 'm', description: 'The absolute path of executable moleculec, if it not provided the internal binary will be used.' }),
    'input-dir': flags.string({ char: 'i', description: 'Specifies a directory which contains molecule schema files.' }),
    'output-package': flags.string({ char: 'p', exclusive: ['output-files'], description: 'Specifies a directory to store the generated typescript package.' }),
    'output-files': flags.string({ char: 'f', exclusive: ['output-package'], description: 'Specifies a directory to store the generated typescript files.' })
  }

  async run (): Promise<void> {
    try {
      const { flags } = this.parse(MoleculeJS)

      if (!isNil(flags.download)) {
        // Download moleculec binary from predefined or custom url.
        const from = flags['download-from'] ?? util.getDownloadFrom()
        const binPath = util.getMoleculec()
        const destDir = path.dirname(binPath)
        const destFile = path.basename(binPath)

        const spinner = ora(`Downloading moleculec from ${from}`).start()
        try {
          await download(from, destDir, { filename: destFile })
          await fs.chmod(binPath, 755)

          spinner.succeed('Downloading finished!')
        } catch (e) {
          spinner.fail('Downloading failed!')
          this.error(e, { exit: 6 })
        }
      } else {
        const moleculec = flags.moleculec ?? util.getMoleculec()
        const inputDir = flags['input-dir']
        const outputPackage = flags['output-package']
        const outputFiles = flags['output-files']

        if (flags.test) {
          // TODO improve testing hooks
          this.log = () => {}
        }

        if (isNil(inputDir)) {
          this.error('The option --input-dir, -i is required.', { exit: 2 })
        }

        const spinner = ora('Check input files and output directory ...').start()
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
          this.error('One of --output-package, -p and --output-files, -f is required.', { exit: 3 })
        }

        spinner.succeed('Found schema files and output directory is writable.')
        spinner.start('Start compiling schema files ...')

        // Parse every schema file to an object in special data structure.
        const tasks: Array<Promise<AST>> = []
        const template = new Template()
        for (const file of schemaFiles) {
          const task: Promise<AST> = new Promise((resolve) => {
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

              // this.log(`Compile file ${filepath} successfully!`)
              spinner.succeed(`Compile file ${filepath} successfully!`)
              // console.log('Original ast:', inspect(ast, false, 4, true))

              resolve(ast)
            })
          })
          tasks.push(task)
        }

        spinner.start('Improving AST ...')

        const trees = await Promise.all(tasks)
        util.genExportsForAST(trees)
        util.improveTypeForAST(trees)
        // console.log('Improved asts:', inspect(trees, false, 4, true))

        // this.log('Improve AST successfully!')
        spinner.succeed('Improve AST successfully!')
        spinner.start('Start writing codes to output directory ...')

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

        const tmpPath = path.join(path.dirname(__dirname), 'tmp')
        try {
          await fs.mkdir(tmpPath, { recursive: true })
        } catch (e) {
          this.error(`Can not ensure temporary directory ${tmpPath} writable: ${e.toString() as string}`, { exit: 2 })
        }

        if (!isNil(outputPackage)) {
          // TODO
        } else if (!isNil(outputFiles)) {
          await Promise.all(codes.map(async ({ filename, code }) => {
            const filepath = path.join(outputFiles, filename + '.ts')
            // const tmpFilepath = path.join(tmpPath, filename + '.ts')
            try {
              code = prettier.format(code, {
                parser: 'typescript',
                tabWidth: 2,
                printWidth: 120,
                singleQuote: true,
                trailingComma: 'none',
                bracketSpacing: true,
                spaceBeforeFunctionParen: true,
                semi: false
              })
              await fs.writeFile(filepath, code)
            } catch (e) {
              this.error(`Write code to file ${filepath} failed: ${e.toString() as string}`, { exit: 2 })
            }
          }))

          spinner.succeed('Write codes to output directory successfully!')
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
