import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.ADMIN_PORT || 8081);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "dist");

const server = http.createServer((req, res) => {
  const url = req.url && req.url !== "/" ? req.url : "/index.html";
  const filePath = path.join(distDir, url.split("?")[0]);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 302;
      res.setHeader("Location", "/index.html");
      res.end();
      return;
    }
    res.statusCode = 200;
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`[admin] listening on :${port}`);
});
