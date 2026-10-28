export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new ApiError(res.status, `요청 실패 (${res.status})`);
  return res.json() as Promise<T>;
}
