module.exports = {
  apps: [
    {
      name: 'stikdead',
      cwd: '/opt/stikdead/server',
      script: 'src/index.js',
      instances: 1,          // 1 instância: as salas vivem em memória (Redis/adapter na expansão)
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
