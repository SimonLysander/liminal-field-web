const BASE_URL = '/api/v1';

export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const body = options?.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return undefined as T;
  }

  const json = JSON.parse(text) as ApiResponse<T>;

  // 业务错误：code !== 0
  if (json.code !== 0) {
    throw new Error(json.msg || `业务错误 (code: ${json.code})`);
  }

  return json.data;
}
