'use strict'

const net = require('net')
const fs = require('fs')
let SOCKETFILE
if (typeof process.env.SOCKETFILE === 'undefined') {
  SOCKETFILE = '/run/sockets/testintern2'
} else {
  SOCKETFILE = process.env.SOCKETFILE
}

const mudRpc = require('./mudRpc')

let client //  = net.createConnection(SOCKETFILE);

let mudConn // = new mudRpc(client);

let connected = false

function rpcClient () {
  this.logon = function (name, pw, cb) {
    if (!connected) {
      console.log('reconnect mudRpc')
      client = net.createConnection(SOCKETFILE)
      mudConn = new mudRpc(client)
      mudConn.on('disconnected', function () {
        connected = false
      })
      connected = true
    }
    mudConn.emit('request', 'webmud3', ['password', name, pw], cb)
  }
}

module.exports = new rpcClient()
