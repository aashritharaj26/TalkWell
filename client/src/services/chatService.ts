import axios from 'axios';

const API_URL = 'http://localhost:5000/api/chat';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const sendMessage = async (message: string, userId: string): Promise<ChatMessage> => {
  try {
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        user_id: userId 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return {
      role: 'assistant',
      content: data.response,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}; 