const os = require('os')
const childProcess = require('child_process')
const num = require('is-number')
const through2 = require('through2')

module.exports = lsofi

const isWindows = os.platform() === 'win32'

// port:Number => Promise<results[Number, Number]>
function lsofi (port) {
  if (typeof port === 'undefined') {
    return Promise.reject(new TypeError('missing required input parameter port'))
  }

  if (!num(port)) {
    return Promise.reject(new TypeError('port must be numeric value'))
  }

  const command = isWindows
    ? ['netstat.exe', '-a', '-n', '-o']
    : ['lsof', `-i:${port}`]

  const columns = isWindows
    ? [null, 'remote', 'local', null, 'pid']
    : [null, 'pid', null, null, null, null, null, null, null]

  const filter = isWindows
    ? windowsFilter(port)
    : unixFilter(port)

  const transform = collate(columns, filter)
  const parser = through2.obj(function (chunk, enc, cb) {
    transform.call(this, chunk, cb)
  })

  return new Promise((resolve, reject) => {
    parser.on('data', chunk => resolve(chunk)) // bail as soon as possible
    parser.on('end', chunk => resolve(null)) // nothing found
    parser.on('error', error => reject(error)) // burp

    const child = childProcess.spawn(command[0], command.slice(1))

    child.stdout
      .pipe(breaklines()) // break buffer chunks into lines
      .pipe(breakwords()) // break line strings into words
      .pipe(parser)
  })
}

// => Stream<line:String>
function breaklines () {
  return through2.obj(function (chunk, _, cb) {
    String(chunk)
      .split('\n')
      .filter(Boolean)
      .forEach(line => this.push(line))
    cb()
  })
}

// => Stream<words:[String]>
function breakwords () {
  return through2.obj(function (chunk, _, cb) {
    const words = chunk.split(' ')
      .map(i => i.trim())
      .filter(Boolean)
      .filter(i => i !== '(LISTEN)') // ugh.
    this.push(words)
    cb()
  })
}

// columns:[String] => words:[String], cb:Function => entry{pid: Number|Null}>
function collate (columns, filter) {
  return function (words, cb) {
    const entry = columns.reduce((entry, column, index) => {
      if (column === null) {
        return entry
      }

      if (!words[index]) {
        return entry
      }

      if (words[index].toLowerCase() === column.toLowerCase()) {
        return entry
      }

      const amend = {}
      amend[column] = words[index]
      return Object.assign({}, entry, amend)
    }, {})

    const filtered = filter(entry)

    if (filtered) {
      this.push(filtered)
    }
    cb()
  }
}

function windowsFilter (port) {
  return i => {
    const ports = [i.remote, i.local]
      .filter(Boolean)
      .filter(address => address !== '*:*')
      .map(address => {
        const fragments = address.split(':')
        return Number(fragments[fragments.length - 1])
      })
      .filter(port => num(port))

    if (!ports.length) {
      return false
    }

    if (ports.indexOf(port) === -1) {
      return false
    }

    const pid = Number(i.pid)

    if (!num(pid)) {
      return false
    }

    return pid
  }
}

function unixFilter (port) {
  return i => {
    if (typeof i !== 'object') {
      return false
    }

    if (Object.keys(i).length === 0) {
      return false
    }

    const pid = Number(i.pid)

    if (!num(pid)) {
      return false
    }

    return pid
  }
}
