import NodeCache from 'node-cache';
import { db } from '../../db';
import { decryptSecret } from './keys';

export interface ModelSettings {
  provider: string;
  model_name: string;
  api_base: string;
  api_key: string;
  temperature: number;
  max_tokens: number;
}

const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

export function getModelSettings(): ModelSettings {
  const cached = cache.get<ModelSettings>('model_settings');
  if (cached) return cached;
  const row = db
    .prepare(
      `SELECT provider, model_name, api_base, api_key_encrypted, temperature, max_tokens
       FROM model_settings ORDER BY updated_at DESC LIMIT 1`,
    )
    .get() as
    | {
        provider: string;
        model_name: string;
        api_base: string;
        api_key_encrypted: string;
        temperature: number;
        max_tokens: number;
      }
    | undefined;
  if (!row) {
    throw new Error('Model settings not configured');
  }
  const settings: ModelSettings = {
    provider: row.provider,
    model_name: row.model_name,
    api_base: row.api_base,
    api_key: decryptSecret(row.api_key_encrypted),
    temperature: row.temperature,
    max_tokens: row.max_tokens,
  };
  cache.set('model_settings', settings);
  return settings;
}

export function refreshModelSettings() {
  cache.del('model_settings');
}
