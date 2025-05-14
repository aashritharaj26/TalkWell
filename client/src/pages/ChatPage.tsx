import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, BarChart2, Download, X } from 'lucide-react';
import { sendMessage, ChatMessage } from '../services/chatService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface SentimentData {
  score: number;
  mood: 'positive' | 'neutral' | 'negative';
  primary_mood: string;
  detected_moods: string[];
}

interface ChatReport {
  chat_history: Array<{
    message: string;
    response: string;
    sentiment: SentimentData;
    timestamp: string;
  }>;
  average_sentiment: number;
  mood_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  statistics: {
    total_messages: number;
    positive_percentage: number;
    negative_percentage: number;
    average_message_length: number;
    most_common_mood: string;
  };
  time_series: Array<{
    timestamp: string;
    score: number;
    mood: string;
  }>;
  daily_trend: Array<{
    date: string;
    average: number;
  }>;
}

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<ChatReport | null>(null);
  const [isEndingSession, setIsEndingSession] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Initialize chat with welcome message
    setMessages([
      {
        role: 'assistant',
        content: `Hey ${user?.name}! I'm here to chat and support you. How are you feeling today?`,
        timestamp: new Date()
      }
    ]);
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input, user?.id || 'default_user');
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/chat/report/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const data = await response.json();
      setReport(data);
      setShowReport(true);
    } catch (error) {
      console.error('Error fetching report:', error);
      // Show error message to user
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while fetching your report. Please try again.',
        timestamp: new Date()
      }]);
    }
  };

  const exportReport = () => {
    if (!report) return;
    
    const reportData = {
      ...report,
      exportDate: new Date().toISOString(),
      userName: user?.name
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'positive': return 'text-green-500';
      case 'neutral': return 'text-yellow-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getMoodBgColor = (mood: string) => {
    switch (mood) {
      case 'positive': return 'bg-green-100 dark:bg-green-900';
      case 'neutral': return 'bg-yellow-100 dark:bg-yellow-900';
      case 'negative': return 'bg-red-100 dark:bg-red-900';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'anxious': return '😰';
      case 'angry': return '😠';
      case 'relaxed': return '😌';
      case 'confused': return '😕';
      case 'overwhelmed': return '😫';
      default: return '😐';
    }
  };

  const renderMoodTrend = () => {
    if (!report?.daily_trend?.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No mood data available yet
        </div>
      );
    }

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={report.daily_trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date: string) => new Date(date).toLocaleDateString()}
            />
            <YAxis domain={[0, 5]} />
            <Tooltip 
              labelFormatter={(date: string) => new Date(date).toLocaleDateString()}
              formatter={(value: number) => [`${value.toFixed(1)}/5`, 'Mood Score']}
            />
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="#6366f1" 
              strokeWidth={2}
              dot={{ fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const handleEndSession = async () => {
    if (!user) return;
    
    setIsEndingSession(true);
    try {
      // Get the final report
      const response = await fetch(`http://localhost:5000/api/chat/report/${user.id}`);
      if (!response.ok) throw new Error('Failed to get chat report');
      
      // Clear the chat history
      setMessages([]);
      setShowReport(false);
      
      // Show success message
      alert('Chat session ended. Your mood report has been saved.');
    } catch (error) {
      console.error('Error ending chat session:', error);
      alert('Error saving chat report. Please try again.');
    } finally {
      setIsEndingSession(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chat with AI</h1>
          <div className="flex space-x-2">
            <button
              onClick={fetchReport}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <BarChart2 className="w-5 h-5" />
              <span>View Report</span>
            </button>
            {showReport && (
              <button
                onClick={exportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
            )}
          </div>
          <button
            onClick={handleEndSession}
            disabled={isEndingSession || messages.length === 0}
            className={`px-4 py-2 rounded-lg text-white ${
              isEndingSession || messages.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isEndingSession ? 'Ending Session...' : 'End Chat Session'}
          </button>
        </div>

        {showReport && report && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chat Analysis Report</h2>
              <button
                onClick={() => setShowReport(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-300">Average Mood</p>
                <p className={`text-lg font-semibold ${getMoodColor(report.average_sentiment > 3 ? 'positive' : report.average_sentiment > 2 ? 'neutral' : 'negative')}`}>
                  {report.average_sentiment.toFixed(1)}/5
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-300">Primary Mood</p>
                <p className="text-lg font-semibold flex items-center space-x-2">
                  <span>{getMoodEmoji(report.statistics.most_common_mood)}</span>
                  <span className="capitalize">{report.statistics.most_common_mood}</span>
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Messages</p>
                <p className="text-lg font-semibold text-indigo-500">{report.statistics.total_messages}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-300">Mood Distribution</p>
                <p className="text-lg font-semibold">
                  {report.mood_distribution.positive}% Positive
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Mood Trend</h3>
              {renderMoodTrend()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h3 className="text-lg font-semibold mb-2">Detected Moods</h3>
                <div className="flex flex-wrap gap-2">
                  {report.chat_history[report.chat_history.length - 1]?.sentiment.detected_moods.map((mood) => (
                    <span
                      key={mood}
                      className="px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 flex items-center space-x-1"
                    >
                      <span>{getMoodEmoji(mood)}</span>
                      <span className="capitalize">{mood}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h3 className="text-lg font-semibold mb-2">Additional Statistics</h3>
                <div className="space-y-2">
                  <p>Average Message Length: {report.statistics.average_message_length} characters</p>
                  <p>Negative Messages: {report.statistics.negative_percentage}%</p>
                  <p>Neutral Messages: {100 - report.statistics.positive_percentage - report.statistics.negative_percentage}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}