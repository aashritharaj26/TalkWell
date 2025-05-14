import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionnaireQuestion extends Document {
  text: string;
  name: string;
  order: number;
  type: 'positive' | 'negative';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionnaireQuestionSchema: Schema = new Schema({
  text: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['positive', 'negative'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IQuestionnaireQuestion>('QuestionnaireQuestion', QuestionnaireQuestionSchema); 