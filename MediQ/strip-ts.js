const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const dir = process.argv[2] || '.';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach((file) => {
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  // Skip config files if any
  if (file.includes('next-env.d.ts')) return;
  if (file.includes('next.config.ts')) {
    const code = fs.readFileSync(file, 'utf-8');
    const newCode = code.replace(/import type { NextConfig } from "next";\s+const nextConfig: NextConfig = {/g, '/** @type {import(\'next\').NextConfig} */\nconst nextConfig = {');
    fs.writeFileSync(file.replace('.ts', '.mjs'), newCode);
    fs.unlinkSync(file);
    return;
  }

  const isTSX = file.endsWith('.tsx');
  const code = fs.readFileSync(file, 'utf-8');
  
  try {
    const output = babel.transformSync(code, {
      filename: file,
      presets: [
        ['@babel/preset-typescript', { isTSX, allExtensions: true }]
      ],
      plugins: [
        '@babel/plugin-syntax-jsx'
      ],
      retainLines: true,
      generatorOpts: {
        retainLines: true,
      }
    });

    if (output && output.code) {
      let newPath = file.replace('.tsx', '.jsx').replace('.ts', '.js');
      // Fix imports
      let newCode = output.code;
      // Also remove `.ts` or `.tsx` references from imports if any (Next.js doesn't usually have them, but let's be safe)
      
      fs.writeFileSync(newPath, newCode);
      console.log(`Converted: ${file} -> ${newPath}`);
      fs.unlinkSync(file);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});
