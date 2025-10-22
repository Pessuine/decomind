import { spawn } from "child_process";

const preview = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "preview"], {
  stdio: "inherit",
});

preview.on("exit", (code) => {
  process.exit(code ?? 0);
});
