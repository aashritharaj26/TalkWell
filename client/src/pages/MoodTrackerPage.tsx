import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Plus, Smile, Frown, Meh, History } from 'lucide-react';
import MoodQuestionnaire from '../components/MoodQuestionnaire';

interface MoodEntry {
  _id: string;
  date: string;
  totalScore: number;
  answers: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    q5: number;
    q6: number;
    q7: number;
    q8: number;
    q9: number;
    q10: number;
  };
  mood: string;
  created_at: string;
}

export default function MoodTrackerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestEntry, setLatestEntry] = useState<MoodEntry | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadMoodHistory();
  }, [user, navigate]);

  const loadMoodHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/mood/questionnaire/${user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mood history');
      }
      
      const data = await response.json();
      // Transform the data to match our interface
      const transformedData = data.map((entry: any) => ({
        ...entry,
        totalScore: entry.total_score,
        answers: entry.answers
      }));
      setEntries(transformedData);
    } catch (error) {
      console.error('Error loading mood history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load mood history');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireSubmit = async (totalScore: number, answers: any) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/mood/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          total_score: totalScore,
          answers,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to submit questionnaire: ' + errorText);
      }

      const result = await response.json();
      const newEntry = {
        ...result.data,
        totalScore: result.data.total_score,
        answers: result.data.answers,
        mood: result.data.mood,
        date: result.data.date,
        created_at: result.data.created_at,
      };
      setLatestEntry(newEntry);
      setShowQuestionnaire(false);
      setShowHistory(false);
      // Optionally reload history
      await loadMoodHistory();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save mood entry');
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'great':
        return <Smile className="w-6 h-6 text-green-500" />;
      case 'good':
        return <Smile className="w-6 h-6 text-yellow-500" />;
      case 'okay':
        return <Meh className="w-6 h-6 text-orange-500" />;
      case 'poor':
        return <Frown className="w-6 h-6 text-red-500" />;
      default:
        return <Meh className="w-6 h-6 text-gray-500" />;
    }
  };

  const getMoodInsights = (entry: MoodEntry) => {
    const insights = [];
    const suggestions = [];

    if (entry.answers.q1 <= 3) {
      insights.push("Lower energy levels");
      suggestions.push("Try light exercise or short breaks");
    }
    if (entry.answers.q2 <= 3) {
      insights.push("Sleep quality needs improvement");
      suggestions.push("Establish a consistent sleep schedule");
    }
    if (entry.answers.q3 >= 4) {
      insights.push("Good task motivation");
    }
    if (entry.answers.q4 <= 2) {
      insights.push("Difficulty with focus");
      suggestions.push("Try the Pomodoro technique");
    }
    if (entry.answers.q5 >= 4) {
      insights.push("Strong social connections");
    }
    if (entry.answers.q6 <= 2) {
      insights.push("Less joy in daily activities");
      suggestions.push("Practice gratitude");
    }
    if (entry.answers.q7 <= 2) {
      insights.push("High stress levels");
      suggestions.push("Try deep breathing exercises");
    }
    if (entry.answers.q8 >= 4) {
      insights.push("Good confidence levels");
    }
    if (entry.answers.q9 <= 3) {
      insights.push("Reduced enjoyment in activities");
      suggestions.push("Explore new interests");
    }
    if (entry.answers.q10 >= 4) {
      insights.push("Positive future outlook");
    }

    return { insights, suggestions };
  };

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
            onClick={loadMoodHistory}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mood Tracker</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowQuestionnaire(true);
                  setShowHistory(false);
                }}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                <span>New Entry</span>
              </button>
              <button
                onClick={() => {
                  setShowQuestionnaire(false);
                  setShowHistory(true);
                }}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <History className="w-5 h-5" />
                <span>Past Analysis</span>
              </button>
            </div>
          </div>

          {showQuestionnaire && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <MoodQuestionnaire onSubmit={handleQuestionnaireSubmit} />
            </div>
          )}

          {/* Show latest entry after submission */}
          {latestEntry && !showQuestionnaire && !showHistory && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <span className="text-lg font-semibold">
                  Score: {latestEntry.totalScore}/50
                </span>
                <span className="text-sm text-gray-500">
                  {latestEntry.created_at ? new Date(latestEntry.created_at).toLocaleDateString() : new Date(latestEntry.date).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Insights</h3>
                <div className="space-y-2">
                  {getMoodInsights(latestEntry).insights.map((insight, index) => (
                    <p key={index} className="text-sm text-gray-600 dark:text-gray-300">
                      • {insight}
                    </p>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Suggestions</h3>
                <div className="space-y-2">
                  {getMoodInsights(latestEntry).suggestions.length > 0
                    ? getMoodInsights(latestEntry).suggestions.map((suggestion, index) => (
                        <p key={index} className="text-sm text-indigo-600 dark:text-indigo-400">
                          • {suggestion}
                        </p>
                      ))
                    : <p className="text-sm text-gray-400">No suggestions for improvement.</p>
                  }
                </div>
              </div>
            </div>
          )}

          {/* Show all past entries grouped by date when viewing history */}
          {showHistory && entries.length > 0 && (
            <div className="space-y-6">
              {Object.entries(
                entries.reduce((acc, entry) => {
                  const date = new Date(entry.date).toLocaleDateString();
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(entry);
                  return acc;
                }, {} as Record<string, MoodEntry[]>)
              ).map(([date, dayEntries]) => (
                <div key={date} className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{date}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dayEntries.map((entry, idx) => (
                      <div key={entry._id || idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <span className="text-lg font-semibold">Score: {entry.totalScore}/50</span>
                        <div className="mt-2">
                          {getMoodInsights(entry).insights.map((insight, i) => (
                            <p key={i} className="text-sm text-gray-600 dark:text-gray-300">• {insight}</p>
                          ))}
                        </div>
                        {getMoodInsights(entry).suggestions.length > 0 && (
                          <div className="mt-2">
                            {getMoodInsights(entry).suggestions.map((suggestion, i) => (
                              <p key={i} className="text-sm text-indigo-600 dark:text-indigo-400">• {suggestion}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}