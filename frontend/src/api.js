import axios from 'axios';
const BASE_URL = "http://localhost:5000"; // Or your actual backend URL
const API_URL = 'http://localhost:5000';

export const getDevices = () => axios.get(`${API_URL}/devices`);
export const saveSession = (sessionData) =>
    axios.post(`${BASE_URL}/sessions/start`, sessionData);
  
  export const endSession = (sessionData) =>
    axios.post(`${BASE_URL}/sessions/end`, sessionData);
  export const startSession = async (transactionId, deviceId) => {
    return fetch("http://localhost:5000/api/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, deviceId }),
    }).then(response => response.json());
  };
  