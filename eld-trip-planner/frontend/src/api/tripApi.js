import axios from 'axios';

const API_BASE_URL = '/api/trip-planner';

export const planTrip = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/plan-trip/`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reverse-geocode/`, { params: { lat, lng } });
    return response.data.address;
  } catch (error) {
    console.error('Reverse Geocode Error:', error);
    return null;
  }
};
