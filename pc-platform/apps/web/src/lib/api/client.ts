import { configureApiClient, ApiClientError } from '@pc-platform/api-client';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
};

const getClientToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexus_auth_token');
};

// Initialize the API client
configureApiClient({
  baseUrl: getBaseUrl(),
  getToken: getClientToken,
});

export { ApiClientError };
export * from '@pc-platform/api-client';
