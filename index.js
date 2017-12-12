'use strict'

require('dotenv').config({ silient: true })
require('now-logs')('phim.clgt.vn')
require('./lib/array-concatAll')

const server = require('./lib/server')

server.listen({
    port: process.env.PORT || 3000
});