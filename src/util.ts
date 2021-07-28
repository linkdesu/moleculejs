import * as os from 'os'
import * as path from 'path'
import { constants as fs_const, promises as fs } from 'fs'

export function getMoleculec (): string {
  let binPath = path.join(path.dirname(__dirname), 'moleculec')

  switch (os.platform()) {
    case 'darwin':
      binPath = path.join(binPath, 'moleculec-darwin')
      break
    case 'linux':
      binPath = path.join(binPath, 'moleculec-linux')
      break
    default:
      throw new Error('Unsupported platform')
  }

  return binPath
}

export async function isDirectoryWritable (path: string): Promise<void> {
  await fs.access(path, fs_const.W_OK)
  const stat = await fs.stat(path)
  if (!stat.isDirectory()) {
    throw new Error(`The path ${path} should be a Directory.`)
  }
}

export function groupImportTypesBySource (trees: AST[], currentNamespace: string, importedTypes: string[]): { [group: string]: string[] } {
  const groups: { [group: string]: string[] } = {}

  for (const ast of trees) {
    if (ast.namespace === currentNamespace) {
      continue
    }

    for (const token of ast.declarations) {
      if (importedTypes.includes(token.name)) {
        if (!Object.prototype.hasOwnProperty.call(groups, ast.namespace)) {
          groups[ast.namespace] = []
        }

        groups[ast.namespace].push(token.name)
      }
    }
  }

  return groups
}
