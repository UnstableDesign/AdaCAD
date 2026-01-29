> Find processes occupying a given port

# lsofi [![stability][0]][1]

[![npm version][6]][7] [![Travis branch][2]][3] [![AppVeyor branch][4]][5]

## Rationale

* `lsof -i :<port>` for unix, darwin and win32 alike

## Installation

Grab it from npm

* `npm install --save lsofi`

## Usage

```js
// given 1337 is occupied and 1338 is not
const lsofi = require('lsofi')
const occupied = await lsofi(1337)
const free = await(1338)

console.log(occupied, free)
// => console.log(9834, null)
```

## See also

* [krampus](https://github.com/marionebl/krampus) - Kill processes occupying a given port

---
lsofi is built by [marionebl](https://github.com/marionebl) and [contributors](https://github.com/marionebl/lsofi/graphs/contributors). It is released unter the [MIT](https://github.com/marionebl/lsofi/blob/master/LICENSE) license.

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/travis/marionebl/lsofi/master.svg?style=flat-square
[3]: https://travis-ci.org/marionebl/lsofi
[4]: https://img.shields.io/appveyor/ci/marionebl/lsofi/master.svg?style=flat-square
[5]: https://ci.appveyor.com/project/marionebl/lsofi
[6]: https://img.shields.io/npm/v/lsofi.svg?style=flat-square
[7]: https://npmjs.org/package/lsofi
