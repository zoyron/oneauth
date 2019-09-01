module.exports = {
    apps : [
        {
          name: "oneauth",
          script: "src/server.js",
          instances: 'max',
          exec_mode: "cluster",
          max_memory_restart: "2000M",
          env: {
              "NODE_ENV": "development"
          },
          env_production: {
              "NODE_ENV": "production",
          }
        }
    ]
  }