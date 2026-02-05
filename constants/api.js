import { Platform } from 'react-native';

const getApiBaseUrl = () => {
 
  const ACTUAL_IP = '192.168.100.192'; // Your backend IP
  const PORT = '5000';
  
  if (__DEV__) {
    
    return `http://192.168.100.192:5000/api`;
  } else {
    // Production mode
    return `http://${ACTUAL_IP}:${PORT}/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();


console.log('🌐 API Base URL:', API_BASE_URL);

export default API_BASE_URL;