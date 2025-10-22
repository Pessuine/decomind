import type Database from "better-sqlite3";

export interface FeedbackRepo {
  insertFeedback(input: { task_uuid: string; mode: string; rating: string; note?: string | null }): void;
  insertConsent(input: { consented: boolean }): void;
}

export function createFeedbackRepo(db: Database.Database): FeedbackRepo {
  const insertFeedbackStmt = db.prepare(
    `INSERT INTO feedback (task_uuid, mode, rating, note, extra) VALUES (@task_uuid, @mode, @rating, @note, json(@extra))`
  );
  const insertConsentStmt = db.prepare(
    `INSERT INTO consents (consented, extra) VALUES (@consented, json(@extra))`
  );

  return {
    insertFeedback({ task_uuid, mode, rating, note }) {
      insertFeedbackStmt.run({
        task_uuid,
        mode,
        rating,
        note: note ?? null,
        extra: JSON.stringify({})
      });
    },
    insertConsent({ consented }) {
      insertConsentStmt.run({
        consented: consented ? 1 : 0,
        extra: JSON.stringify({})
      });
    }
  };
}
