import { resolve } from 'node:path';

import { appRoot } from '../common/app-paths.js';

export function getUploadDir(value: string | undefined) {
  const normalized = (value ?? './uploads').trim().replace(/^['"]|['"]$/g, '');
  return normalized || './uploads';
}

export function getUploadRoot(value: string | undefined) {
  return resolve(appRoot, getUploadDir(value));
}
