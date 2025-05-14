import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Question {
  _id: string;
  text: string;
  name: string;
  order: number;
  type: 'positive' | 'negative';
}

interface MoodQuestionnaireProps {
  onSubmit: (totalScore: number, answers: Record<string, number>) => void;
}

export default function MoodQuestionnaire({ onSubmit }: MoodQuestionnaireProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/questionnaire/questions');
        setQuestions(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load questions. Please try again later.');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const calculateScore = (question: Question, answer: number): number => {
    // For positive questions: 1=1, 2=2, 3=3, 4=4, 5=5
    // For negative questions: 1=5, 2=4, 3=3, 4=2, 5=1
    return question.type === 'positive' ? answer : 6 - answer;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let totalScore = 0;
    questions.forEach(question => {
      const answer = answers[question.name];
      if (answer) {
        totalScore += calculateScore(question, answer);
      }
    });
    onSubmit(totalScore, answers);
  };

  const handleAnswerChange = (questionName: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionName]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        How are you feeling today?
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((question) => (
          <div 
            key={question._id} 
            className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-sm"
          >
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
              {question.order}. {question.text}
            </p>
            <div className="flex justify-around">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="flex flex-col items-center">
                  <input
                    type="radio"
                    name={question.name}
                    value={value}
                    checked={answers[question.name] === value}
                    onChange={() => handleAnswerChange(question.name, value)}
                    className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-2 focus:ring-indigo-400 transition-all"
                    required
                  />
                  <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {question.type === 'positive' ? value : 6 - value}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span>1 (Strongly Disagree)</span>
          <span>5 (Strongly Agree)</span>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all"
        >
          Submit Questionnaire
        </button>
      </form>
    </div>
  );
}
