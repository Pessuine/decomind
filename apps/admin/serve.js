const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const port = Number(process.env.PORT || 8081);

const server = http.createServer((_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', message: 'Admin placeholder service' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Admin placeholder service listening on port ${port}`);
});
