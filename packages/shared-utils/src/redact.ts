export function redactPayload(payload: unknown, maxLength = 512): string {
  try {
    const json = JSON.stringify(payload);
    if (json.length <= maxLength) {
      return json;
    }
    return json.slice(0, maxLength) + "…";
  } catch {
    return "[unserializable]";
  }
}
