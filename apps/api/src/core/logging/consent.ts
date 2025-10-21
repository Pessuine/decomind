import { db } from '../../db';

export function hasConsent(): boolean {
  const row = db.prepare('SELECT consented FROM consents ORDER BY ts DESC LIMIT 1').get() as { consented: number } | undefined;
  return !!row?.consented;
}
