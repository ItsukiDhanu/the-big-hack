export async function requestJson<T>(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(url, { ...options, credentials: "same-origin", cache: "no-store" });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || fallbackMessage);
  return body;
}
