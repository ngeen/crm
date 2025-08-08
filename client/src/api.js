import axios from 'axios';

/**
 * Creates a configured instance of axios for API calls.
 *
 * In production, `process.env.REACT_APP_API_URL` will be 'https://api.oenginoz.com',
 * so all requests will be sent to the correct absolute URL.
 *
 * In development, `process.env.REACT_APP_API_URL` is not set, so requests
 * will be relative (e.g., '/api/auth/login') and handled by `setupProxy.js`.
 */
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // This will be undefined in dev, which is correct.
  withCredentials: true, // This is essential for sending session cookies on cross-domain requests
});

export default apiClient;