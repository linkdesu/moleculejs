import * as os from 'os'
import * as path from 'path'
import { constants as fs_const, promises as fs } from 'fs'
import { isNil, isNumber } from 'lodash'

import { BUFFER_TYPE, BYTE_TYPE, Platform } from './const'

export function getPlatform (): Platform | null {
  switch (`${os.platform()}_${os.arch()}`) {
    case 'linux_x64':
      return Platform.LinuxX64
    case 'darwin_x64':
      return Platform.DarwinX64
    default:
      return null
  }
}

export function getMoleculec (): string {
  let binPath = path.join(path.dirname(__dirname), 'moleculec')

  switch (getPlatform()) {
    case Platform.LinuxX64:
      binPath = path.join(binPath, 'moleculec-linux')
      break
    case Platform.DarwinX64:
      binPath = path.join(binPath, 'moleculec-darwin')
      break
    default:
      throw new Error('Sorry, moleculejs only has prebuilt moleculec for linux_x64 and darwin_x64 platforms, it is welcome that anyone provide supporting for more platforms.')
  }

  return binPath
}

export function getDownloadFrom (): string {
  let url = 'https://github.com/linkdesu/moleculejs/releases/download/v1.0.0/'

  switch (getPlatform()) {
    case Platform.LinuxX64:
      url += 'moleculec-linux'
      break
    case Platform.DarwinX64:
      url += 'moleculec-darwin'
      break
    default:
      throw new Error('Sorry, moleculejs only has prebuilt moleculec for linux_x64 and darwin_x64 platforms, it is welcome that anyone provide supporting for more platforms.')
  }

  return url
}

export async function isDirectoryWritable (path: string): Promise<void> {
  await fs.access(path, fs_const.W_OK)
  const stat = await fs.stat(path)
  if (!stat.isDirectory()) {
    throw new Error(`The path ${path} should be a Directory.`)
  }
}

export function isArrayToken (token: Token): token is ArrayToken {
  return token.type === 'array'
}

export function isStructToken (token: Token): token is StructToken {
  return token.type === 'struct'
}

export function isVectorToken (token: Token): token is VectorToken {
  return token.type === 'fixvec' || token.type === 'dynvec'
}

export function isTableToken (token: Token): token is TableToken {
  return token.type === 'table'
}

export function isOptionToken (token: Token): token is OptionToken {
  return token.type === 'option'
}

export function isUnionToken (token: Token): token is UnionToken {
  return token.type === 'union'
}

/**
 * Generate exports information in abstract-syntax-tree
 *
 * @param {AST[]} trees
 */
export function genExportsForAST (trees: AST[]): void {
  for (const ast of trees) {
    ast.exports = []
    for (const token of ast.declarations) {
      if (isNil(token.imported_depth)) {
        ast.exports.push(token.name)
      }
    }
  }
}

/**
 * Improve type information for all kinds of token
 *
 * @param {AnyToken} token
 */
export function improveTypeForToken (token: AnyToken): void {
  if (isArrayToken(token) || isVectorToken(token) || isOptionToken(token)) {
    if (token.item === BYTE_TYPE) {
      token.item = BUFFER_TYPE
    }
  } else if (isStructToken(token) || isTableToken(token)) {
    for (const field of token.fields) {
      if (field.type === BYTE_TYPE) {
        field.type = BUFFER_TYPE
      }
    }
  } else if (isUnionToken(token)) {
    for (let i = 0; i < token.items.length; i++) {
      if (token.items[i] === BYTE_TYPE) {
        token.items[i] = BUFFER_TYPE
      }
    }
  } else {
    throw new Error(`Unknown token type, token structure: ${token as string}`)
  }
}

export function findUsedTypes (token: AnyToken): string[] {
  if (isArrayToken(token) || isVectorToken(token) || isOptionToken(token)) {
    return [token.item]
  } else if (isStructToken(token) || isTableToken(token)) {
    return token.fields.map(field => field.type)
  } else if (isUnionToken(token)) {
    return token.items
  } else {
    throw new Error(`Unknown token type, token structure: ${token as string}`)
  }
}

/**
 * Improve kinds of type information in abstract-syntax-tree
 *
 * @param {AST[]} trees
 */
export function improveTypeForAST (trees: AST[]): void {
  for (const ast of trees) {
    // console.log('ast.namespace:', ast.namespace)
    let typesUsed: string[] = []
    const optionTypes: string[] = []
    const tokenToRemove: number[] = []
    let importedTypes: string[] = []
    // Find out imported types and add it to related namespace.
    ast.declarations.forEach((token, i) => {
      if (isNumber(token.imported_depth) && token.imported_depth > 0) {
        importedTypes.push(token.name)
        tokenToRemove.push(i)
      } else {
        improveTypeForToken(token)
        typesUsed = typesUsed.concat(findUsedTypes(token))
      }

      if (isOptionToken(token)) {
        optionTypes.push(token.name)
      }
    })

    // Filter really used types from imported types.
    importedTypes = importedTypes.filter(item => typesUsed.includes(item))
    // console.log('importedTypes:', importedTypes)

    const importedTypesGroups = groupImportTypesBySource(trees, ast.namespace, importedTypes)
    // console.log('importedTypesGroups:', importedTypesGroups)
    for (const _import of ast.imports) {
      if (Object.prototype.hasOwnProperty.call(importedTypesGroups, _import.name)) {
        _import.types = importedTypesGroups[_import.name]
      }
    }

    // Filter empty imports.
    ast.imports = ast.imports.filter(item => !isNil(item.types) && item.types.length > 0)

    // Remove imported types from current tree.
    tokenToRemove.reverse().forEach(tokenIndex => {
      ast.declarations.splice(tokenIndex, 1)
    })

    ast.declarations.forEach(token => {
      if (isVectorToken(token)) {
        if (optionTypes.includes(token.item)) {
          token.is_option = true
        }
      } else if (isTableToken(token)) {
        token.fields.forEach(field => {
          if (optionTypes.includes(field.type)) {
            field.is_option = true
          }
        })
      }
    })
  }
}

function groupImportTypesBySource (trees: AST[], currentNamespace: string, importedTypes: string[]): { [group: string]: string[] } {
  const groups: { [group: string]: string[] } = {}

  for (const ast of trees) {
    if (ast.namespace === currentNamespace) {
      continue
    }

    for (const token of ast.declarations) {
      if (importedTypes.includes(token.name) && isNil(token.imported_depth)) {
        if (!Object.prototype.hasOwnProperty.call(groups, ast.namespace)) {
          groups[ast.namespace] = []
        }

        groups[ast.namespace].push(token.name)
      }
    }
  }

  return groups
}
