const http = require('http');
const path = require('path');
const sirv = require('sirv');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const port = Number(process.env.PORT || 4173);
const distDir = path.resolve(__dirname, 'dist', 'client');
const serve = sirv(distDir, { dev: false, single: true });

const server = http.createServer((req, res) => {
  serve(req, res);
});

server.listen(port, () => {
  console.log(`[admin] serving dist at http://localhost:${port}`);
});
