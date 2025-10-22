const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.ADMIN_PORT || 8081);
const distDir = path.join(__dirname, "dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url && req.url !== "/" ? req.url : "/index.html";
  const filePath = path.join(distDir, urlPath);
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      const indexPath = path.join(distDir, "index.html");
      fs.createReadStream(indexPath)
        .on("error", () => {
          res.writeHead(404);
          res.end("Not found");
        })
        .on("open", function () {
          res.writeHead(200, { "Content-Type": "text/html" });
        })
        .pipe(res);
      return;
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`[admin] listening on port ${port}`);
});
