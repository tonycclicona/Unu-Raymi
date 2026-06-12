// ==============================================================================
// server.js — Safe Mode Stalling Server for Hostinger Node.js
// ==============================================================================

'use strict';

const http = require('http');
const port = parseInt(process.env.PORT || '3000', 10);

console.log('> SAFE MODE: Running minimal server on port ' + port);

http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Safe Mode: Cleaning resources, please reload shortly.');
}).listen(port, function() {
  console.log('> SAFE MODE: Listening on port ' + port);
});
