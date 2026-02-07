import { Platform } from 'react-native';

const getApiBaseUrl = () => {
 
  const ACTUAL_IP = 'api.fbareaadmin.cloud'; // Your backend IP
  const PORT = '5000';
  
  if (__DEV__) {
    
    return `http://api.fbareaadmin.cloud/api`;
  } else {
    // Production mode
    return `https://${ACTUAL_IP}/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();


console.log('🌐 API Base URL:', API_BASE_URL);

export default API_BASE_URL;