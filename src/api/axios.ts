import axios from 'axios';

// ✅ Extend Axios types
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: { startTime: number };
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url} - START`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url} - ${duration}ms`);
    
    if (duration > 2000) {
      console.warn(`🐌 SLOW REQUEST: ${response.config.url} took ${duration}ms!`);
    }
    return response;
  },
  (error) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    console.error(`❌ [${error.config?.method?.toUpperCase()}] ${error.config?.url} - ${duration}ms - ERROR:`, error.message);
    return Promise.reject(error);
  }
);

export default api;