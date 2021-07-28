
interface AST {
  namespace: string
  imports: Import[]
  exports?: string[]
  declarations: Array<ArrayToken | StructToken | VectorToken>
}

interface Import {
  name: string
  types?: string[]
  paths: string[]
  path_supers: number
}

interface Token {
  type: string
  name: string
  imported_depth?: number
}

interface ArrayToken extends Token {
  item: string
  item_count: number
}

interface StructToken extends Token {
  fields: Token[]
}

interface VectorToken extends Token {
  item: string
}
