import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MoodReport {
  _id: string;
  date: string;
  average_mood: number;
  primary_mood: string;
  total_messages: number;
  mood_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  mood_trend: Array<{
    date: string;
    average: number;
  }>;
  detected_moods: string[];
  statistics: {
    average_message_length: number;
    negative_percentage: number;
    neutral_percentage: number;
  };
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const getMoodEmoji = (mood: string): string => {
  switch (mood.toLowerCase()) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'angry':
      return '😠';
    case 'anxious':
      return '😰';
    case 'excited':
      return '🤩';
    case 'tired':
      return '😴';
    case 'neutral':
    default:
      return '😐';
  }
};

const getMoodColor = (mood: string): string => {
  switch (mood.toLowerCase()) {
    case 'happy':
    case 'excited':
      return 'bg-green-100 text-green-800';
    case 'sad':
    case 'tired':
      return 'bg-blue-100 text-blue-800';
    case 'angry':
      return 'bg-red-100 text-red-800';
    case 'anxious':
      return 'bg-yellow-100 text-yellow-800';
    case 'neutral':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<MoodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MoodReport | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [calendarData, setCalendarData] = useState<any>(null);

  const fetchReports = async () => {
    if (isFetching) return;
    
    setIsFetching(true);
    setError(null);
    
    try {
      console.log('Fetching reports for user:', user?.id);
      const response = await fetch(`http://localhost:5000/api/mood/reports/${user?.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reports');
      }
      
      const data = await response.json();
      console.log('Received reports:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array of reports');
      }
      
      // Sort reports by date in descending order
      const sortedReports = data.sort((a: MoodReport, b: MoodReport) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setReports(sortedReports);
      
      // Select the most recent report by default
      if (sortedReports.length > 0 && !selectedReport) {
        setSelectedReport(sortedReports[0]);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const fetchCalendarData = async (year: number, month: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mood/calendar/${user?.id}/${year}/${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      const data = await response.json();
      setCalendarData(data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    }
  };

  // Only fetch reports when the component mounts
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [user, navigate]); // Remove isFetching and selectedReport from dependencies

  useEffect(() => {
    if (user) {
      const today = new Date();
      fetchCalendarData(today.getFullYear(), today.getMonth() + 1);
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (reports.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-gray-500 mb-4">No mood reports available yet</div>
          <p className="text-sm text-gray-400">
            Start chatting with the AI to generate your first mood report
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mood Reports</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Refresh</span>
            </button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-gray-500" />
              <span className="text-gray-600">View your mood history</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Mood Calendar</h2>
            {calendarData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date(calendarData.year, calendarData.month - 1, i - new Date(calendarData.year, calendarData.month - 1, 1).getDay() + 1);
                    const moodEntry = calendarData.moods.find((m: any) => m.date === date.toISOString().split('T')[0]);
                    
                    return (
                      <div
                        key={i}
                        className={`aspect-square p-1 ${
                          date.getMonth() === calendarData.month - 1
                            ? 'bg-white'
                            : 'bg-gray-50'
                        }`}
                      >
                        {date.getMonth() === calendarData.month - 1 && (
                          <div className="h-full flex flex-col items-center justify-center">
                            <span className="text-sm text-gray-600">{date.getDate()}</span>
                            {moodEntry && (
                              <div className={`mt-1 p-1 rounded-full ${getMoodColor(moodEntry.primary_mood)}`}>
                                {getMoodEmoji(moodEntry.primary_mood)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Mood Legend</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['happy', 'sad', 'angry', 'anxious', 'excited', 'tired', 'neutral'].map(mood => (
                      <div key={mood} className={`flex items-center space-x-2 p-2 rounded ${getMoodColor(mood)}`}>
                        <span>{getMoodEmoji(mood)}</span>
                        <span className="text-sm capitalize">{mood}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Reports List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Past Reports</h2>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedReport?._id === report._id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDate(report.date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {report.total_messages} messages
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${getMoodColor(report.primary_mood)}`}>
                        {report.average_mood.toFixed(1)}/5
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Report for {formatDate(selectedReport.date)}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-4xl">{getMoodEmoji(selectedReport.primary_mood)}</span>
                    <span className="text-xl font-semibold capitalize">{selectedReport.primary_mood}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Mood Distribution</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Positive</span>
                        <span className="font-medium">{selectedReport.mood_distribution.positive}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-600">Neutral</span>
                        <span className="font-medium">{selectedReport.mood_distribution.neutral}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600">Negative</span>
                        <span className="font-medium">{selectedReport.mood_distribution.negative}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Total Messages</span>
                        <span className="font-medium">{selectedReport.total_messages}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Avg. Message Length</span>
                        <span className="font-medium">{selectedReport.statistics.average_message_length} chars</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Average Mood</span>
                        <span className="font-medium">{selectedReport.average_mood.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Mood Trend</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Daily Average</span>
                      <div className="flex items-center space-x-2">
                        <ChevronLeft className="h-5 w-5 text-gray-400" />
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="h-32 flex items-end space-x-2">
                      {selectedReport.mood_trend.map((day, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ height: `${(day.average / 5) * 100}%` }}
                          title={`${day.date}: ${day.average.toFixed(1)}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Detected Moods</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.detected_moods.map((mood, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{getMoodEmoji(mood)}</span>
                        <span className="capitalize">{mood}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-full">
                <p className="text-gray-500">Select a report to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage; 