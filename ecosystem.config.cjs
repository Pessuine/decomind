module.exports = {
  apps: [
    {
      name: "decompo-api",
      cwd: "apps/api",
      script: "node",
      args: "dist/index.js",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "decompo-admin",
      cwd: "apps/admin",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
