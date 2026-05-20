const { execSync } = require('child_process');

const command = 'npx sass --watch flipFlow.scss flipFlow.css --style=expanded';

console.log('Starting Sass watcher for FlipFlow...');
execSync(command, { stdio: 'inherit' });