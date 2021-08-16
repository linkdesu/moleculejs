# moleculejs

[![License](https://img.shields.io/github/license/linkdesu/moleculejs)](https://github.com/linkdesu/moleculejs/blob/develop/LICENSE)
[![License](https://img.shields.io/github/package-json/v/linkdesu/moleculejs)](https://github.com/linkdesu/moleculejs/releases)


## Usage

- First, write molecule schema files with `.mol` suffix.
- Then, select a directory to store output typescript files.

Now, you could start compiling with the following commands:

```bash
moleculejs -i <path_of_schema_inputs> -f <path_of_ts_outputs>
```

> For more options please try `moleculejs -h` .


## TODO

- [ ] Add github workflow as ci process.
- [ ] Implement unit tests from [nervosnetwork/molecule](https://github.com/nervosnetwork/molecule/tree/master/test).
- [ ] Support customizable eslint configs.
- [ ] Improve console messages for a better experience.
- [ ] Support [Union](https://github.com/nervosnetwork/molecule/blob/master/docs/encoding_spec.md#union) data type.
