import { promises as fs } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const outputPath = fileURLToPath(new URL('./countdown-config.js', import.meta.url));

export function renderCountdownConfig(target = process.env.COUNTDOWN_TARGET) {
  if (!target) return 'globalThis.COUNTDOWN_CONFIG ??= {};\n';
  if (Number.isNaN(new Date(target).getTime())) {
    throw new Error(`COUNTDOWN_TARGET is not a valid date: ${target}`);
  }

  return `globalThis.COUNTDOWN_CONFIG = { target: ${JSON.stringify(target)} };\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await fs.writeFile(outputPath, renderCountdownConfig());
  console.log(`Generated countdown-config.js${process.env.COUNTDOWN_TARGET ? ` for ${process.env.COUNTDOWN_TARGET}` : ' with the default target'}`);
}
