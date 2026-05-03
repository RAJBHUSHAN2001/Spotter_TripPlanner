const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal 
  ? 'http://127.0.0.1:8000/api/trip-planner' 
  : 'https://spotter-backend-jxfl.onrender.com/api/trip-planner';
