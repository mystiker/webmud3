'use strict'

const express = require('express')
const router = express.Router()
const authcon = require('./auth')
// middleware that is specific to this router
router.use(function (req, res, next) {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null)
  console.log(ip, '/api/auth', req.method, req.url)
  next()
})

router.route('/login').post(authcon.logon).get(authcon.loggedon)

router.route('/logout').post(authcon.logout)

module.exports = router
