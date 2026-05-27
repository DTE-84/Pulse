module.exports = {
  apps: [
    {
      name: 'pulse-api',
      script: './src/server/dev.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      watch: ['./src/server'],
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
