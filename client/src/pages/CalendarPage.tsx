import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MoodEntry {
  _id: string;
  user_id: string;
  date: string;
  mood_score: number;
  primary_mood: string;
  detected_moods: string[];
  message: string;
  timestamp: string;
  created_at: string;
}

interface CalendarData {
  moods: MoodEntry[];
  month: number;
  year: number;
}

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

const getMoodColor = (score: number) => {
  if (score > 3) return 'bg-green-100 dark:bg-green-900';
  if (score > 2) return 'bg-yellow-100 dark:bg-yellow-900';
  return 'bg-red-100 dark:bg-red-900';
};

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState<MoodEntry | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMoodCalendar();
  }, [user, currentDate]);

  const fetchMoodCalendar = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/mood/calendar/${user?.id}/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`
      );
      if (!response.ok) throw new Error('Failed to fetch mood calendar');
      const data = await response.json();
      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching mood calendar:', error);
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    if (!calendarData) return null;

    const daysInMonth = getDaysInMonth(calendarData.year, calendarData.month - 1);
    const firstDay = getFirstDayOfMonth(calendarData.year, calendarData.month - 1);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 dark:border-gray-700" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(calendarData.year, calendarData.month - 1, day));
      const dateStr = date.toISOString().split('T')[0];
      const moodEntry = calendarData.moods.find(mood => {
        const moodDate = new Date(mood.date + 'T00:00:00Z');
        return moodDate.toISOString().split('T')[0] === dateStr;
      });

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 dark:border-gray-700 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
            moodEntry ? getMoodColor(moodEntry.mood_score) : ''
          }`}
          onClick={() => moodEntry && setSelectedMood(moodEntry)}
        >
          <div className="font-semibold">{day}</div>
          {moodEntry && (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-2xl">{getMoodEmoji(moodEntry.primary_mood)}</span>
              <span className="text-xs mt-1">{moodEntry.primary_mood}</span>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mood Calendar</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-lg font-semibold">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="bg-white dark:bg-gray-800 p-2 text-center font-semibold"
            >
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>

        {selectedMood && (
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Mood Details for {selectedMood.date}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Submitted at: {selectedMood.created_at ? new Date(selectedMood.created_at).toLocaleString() : 'N/A'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Primary Mood</p>
                <p className="text-lg font-semibold flex items-center space-x-2">
                  <span>{getMoodEmoji(selectedMood.primary_mood)}</span>
                  <span className="capitalize">{selectedMood.primary_mood}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Mood Score</p>
                <p className={`text-lg font-semibold ${getMoodColor(selectedMood.mood_score)}`}>
                  {selectedMood.mood_score.toFixed(1)}/5
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">Detected Moods</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMood.detected_moods.map(mood => (
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
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">Message</p>
                <p className="mt-1">{selectedMood.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 