import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "687e0147cc64e7b83941ced4", 
  requiresAuth: true // Ensure authentication is required for all operations
});
