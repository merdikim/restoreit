import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

export const appRoot = resolve(currentDir, '../..');
