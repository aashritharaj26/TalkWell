const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchMoodPrediction = async (message) => {
  const response = await fetch(`${API_URL}/api/mood/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  return response.json();
};

export const fetchChatResponse = async (message) => {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  return response.json();
};

// Add other API calls as needed 