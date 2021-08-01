
type AnyToken = ArrayToken | StructToken | VectorToken | TableToken | OptionToken | UnionToken

interface AST {
  namespace: string
  imports: Import[]
  exports?: string[]
  declarations: AnyToken[]
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

interface TokenField {
  name: string
  type: string
}

interface ArrayToken extends Token {
  item: string
  item_count: number
}

interface StructToken extends Token {
  fields: TokenField[]
}

interface VectorToken extends Token {
  item: string
}

interface TableToken extends Token {
  fields: TokenField[]
}

interface OptionToken extends Token {
  item: string
}

interface UnionToken extends Token {
  items: string[]
}
