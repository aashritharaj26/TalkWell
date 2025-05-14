import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface Question {
  id: number;
  text: string;
  name: string;
}

const questions: Question[] = [
  { id: 1, text: "I feel energetic and ready to face the day.", name: "q1" },
  { id: 2, text: "I have been sleeping well and waking up refreshed.", name: "q2" },
  { id: 3, text: "I feel motivated to complete my daily tasks.", name: "q3" },
  { id: 4, text: "I have been able to focus on things I start.", name: "q4" },
  { id: 5, text: "I feel connected to the people around me.", name: "q5" },
  { id: 6, text: "I have found joy or satisfaction in small things lately.", name: "q6" },
  { id: 7, text: "I have felt overwhelmed by stress.", name: "q7" },
  { id: 8, text: "I feel confident in handling challenges that come my way.", name: "q8" },
  { id: 9, text: "I have been able to enjoy activities I usually like.", name: "q9" },
  { id: 10, text: "I feel hopeful and positive about the future.", name: "q10" }
];

interface MoodQuestionnaireProps {
  onSubmit: (totalScore: number, answers: Record<string, number>) => void;
}

export default function MoodQuestionnaire({ onSubmit }: MoodQuestionnaireProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let totalScore = 0;
    Object.values(answers).forEach(value => {
      totalScore += value;
    });
    onSubmit(totalScore, answers);
  };

  const handleAnswerChange = (questionName: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionName]: value
    }));
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        How are you feeling today?
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((question) => (
          <div 
            key={question.id} 
            className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-sm"
          >
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
              {question.id}. {question.text}
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
                  <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">{value}</span>
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
