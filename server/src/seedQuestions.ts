import mongoose from 'mongoose';
import QuestionnaireQuestion from './models/QuestionnaireQuestion';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Read questions from questions.json
type Question = { text: string; name: string; order: number };
let initialQuestions: Question[] = [];
const questionsPath = path.join(__dirname, 'questions.json');
try {
  const fileContent = fs.readFileSync(questionsPath, 'utf-8');
  initialQuestions = JSON.parse(fileContent);
} catch (err) {
  console.error('Failed to read questions.json:', err);
  process.exit(1);
}

async function seedQuestions() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Clear existing questions
    await QuestionnaireQuestion.deleteMany({});
    console.log('Cleared existing questions');

    // Insert new questions
    await QuestionnaireQuestion.insertMany(initialQuestions);
    console.log('Successfully seeded questions');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions(); 