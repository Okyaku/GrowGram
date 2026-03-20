import { apiRequest, setAuthToken } from './api';
import { AuthTokens, LoginPayload, SignUpPayload } from '../../types/aws';

type AuthResponse = {
  tokens: AuthTokens;
};

let inMemoryTokens: AuthTokens | null = null;

export const authService = {
  async signUp(payload: SignUpPayload) {
    return apiRequest<{ message: string }>('/auth/signup', 'POST', payload);
  },

  async login(payload: LoginPayload) {
    const response = await apiRequest<AuthResponse>('/auth/login', 'POST', payload);
    inMemoryTokens = response.tokens;
    setAuthToken(response.tokens.accessToken);
    return response.tokens;
  },

  async forgotPassword(email: string) {
    return apiRequest<{ message: string }>('/auth/forgot-password', 'POST', { email });
  },

  async refreshSession() {
    if (!inMemoryTokens?.refreshToken) {
      return null;
    }

    const response = await apiRequest<AuthResponse>('/auth/refresh', 'POST', {
      refreshToken: inMemoryTokens.refreshToken,
    });

    inMemoryTokens = response.tokens;
    setAuthToken(response.tokens.accessToken);
    return response.tokens;
  },

  async logout() {
    inMemoryTokens = null;
    setAuthToken('');
    return Promise.resolve();
  },

  getTokens() {
    return inMemoryTokens;
  },
};
