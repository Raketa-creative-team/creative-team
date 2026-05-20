const { execSync } = require('child_process');

const command = 'npx sass --watch cubeEffect.scss cubeEffect.css --style=expanded';

console.log('Starting Sass watcher for Cube Effect...');
execSync(command, { stdio: 'inherit' });