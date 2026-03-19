module.exports = {
  apps: [
    {
      name: 'pulse-api',
      script: './server/dev.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      watch: ['./server'],
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
