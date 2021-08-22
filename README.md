# moleculejs

[![License](https://img.shields.io/github/license/linkdesu/moleculejs)](https://github.com/linkdesu/moleculejs/blob/develop/LICENSE)
[![License](https://img.shields.io/github/package-json/v/linkdesu/moleculejs)](https://github.com/linkdesu/moleculejs/releases)

This is command line tool for serializing structured binary data. It is implemented via typescript with a prebuilt `moleculec` 
as dependency. `moleculec` is an official compiler for molecule schema, its repository is [@nervosnetwork/molecule](https://github.com/nervosnetwork/molecule).
You may get the detailed encoding spec in there.


## Installation

The recommended way is installing as global package, then you may use the command `moleculejs` wherever you want.

```bash
npm i -g @linkdesu/moleculejs
```

After package installed, you need to download `moleculec` manually, with the following command:

```bash
moleculejs -d
```

⚠️ Download prebuilt from untrusted source is really dangerous, so I also provide a option to download from a custom source:

```bash
moleculejs -d --download-from https://url_to_a_prebuilt_moleculec
```


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
