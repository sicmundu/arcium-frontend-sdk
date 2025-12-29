#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

if (command !== 'init') {
    console.error('Usage: crucible init [project-name]');
    process.exit(1);
}

const projectName = args[1] || '.';
const currentDir = process.cwd();
const targetDir = path.resolve(currentDir, projectName);
const templateDir = path.join(__dirname, '../template');

if (!fs.existsSync(templateDir)) {
    console.error('Error: Template directory not found at', templateDir);
    process.exit(1);
}

console.log(`Initializing Arcium project in ${targetDir}...`);

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

try {
    fs.cpSync(templateDir, targetDir, { recursive: true });
} catch (e) {
    console.error('Error copying files:', e.error);
    process.exit(1);
}

const gitignorePath = path.join(targetDir, '_gitignore');
const dotGitignorePath = path.join(targetDir, '.gitignore');

if (fs.existsSync(gitignorePath)) {
    fs.renameSync(gitignorePath, dotGitignorePath);
}

console.log('Project initialized successfully!');
console.log('Run the following commands to get started:');
if (projectName !== '.') {
    console.log(`  cd ${projectName}`);
}
console.log('  npm install');
console.log('  npm run dev');
