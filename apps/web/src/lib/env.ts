function readApiUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }

  return 'http://localhost:4000/api';
}

function readBaseRpcUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_RPC_URL) {
    return import.meta.env.VITE_BASE_RPC_URL;
  }

  if (typeof process !== 'undefined' && process.env?.VITE_BASE_RPC_URL) {
    return process.env.VITE_BASE_RPC_URL;
  }

  return 'https://mainnet.base.org';
}

function readBaseChainId() {
  const raw =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_CHAIN_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_BASE_CHAIN_ID) ||
    '8453';

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 8453;
}

export const env = {
  apiUrl: readApiUrl(),
  baseRpcUrl: readBaseRpcUrl(),
  baseChainId: readBaseChainId(),
};
