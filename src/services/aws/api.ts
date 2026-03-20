import { env } from '../../config/env';
import { ApiError } from '../../types/aws';

let authToken = '';

export const setAuthToken = (token: string) => {
  authToken = token;
};

const buildHeaders = (headers?: Record<string, string>) => ({
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  ...headers,
});

export async function apiRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers: buildHeaders(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    const error: ApiError = {
      statusCode: response.status,
      message: text || 'API request failed',
    };
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
