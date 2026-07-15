import { Schema, Document, model } from 'mongoose';

export interface ISurvey extends Document {
  startupId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  questions: {
    id: string;
    question: string;
    type: 'text' | 'rating' | 'multiple-choice';
    options?: string[];
  }[];
  status: 'Active' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ISurveyResponse extends Document {
  surveyId: Schema.Types.ObjectId;
  answers: { questionId: string; answer: string | number }[];
  customerSegment?: string;
  respondentEmail?: string;
  createdAt: Date;
}

export interface IInterviewLog extends Document {
  startupId: Schema.Types.ObjectId;
  customerName: string;
  roleOrIndustry?: string;
  feedbackText: string;
  painPoints: string[];
  sentimentScore?: number; // -1 to 1
  sentimentLabel?: 'Positive' | 'Neutral' | 'Negative';
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedback extends Document {
  startupId: Schema.Types.ObjectId;
  source: 'Internal' | 'External' | 'Mentor' | 'Investor' | 'Public';
  authorName: string;
  authorEmail?: string;
  content: string;
  rating: number; // 1-5
  sentimentLabel?: 'Positive' | 'Neutral' | 'Negative';
  suggestions?: string;
  createdAt: Date;
}

const SurveySchema = new Schema<ISurvey>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  questions: [{
    id: { type: String, required: true },
    question: { type: String, required: true },
    type: { type: String, enum: ['text', 'rating', 'multiple-choice'], required: true },
    options: [{ type: String }]
  }],
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' }
}, { timestamps: true });

const SurveyResponseSchema = new Schema<ISurveyResponse>({
  surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true, index: true },
  answers: [{
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true }
  }],
  customerSegment: { type: String },
  respondentEmail: { type: String }
}, { timestamps: true });

const InterviewLogSchema = new Schema<IInterviewLog>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  customerName: { type: String, required: true },
  roleOrIndustry: { type: String },
  feedbackText: { type: String, required: true },
  painPoints: [{ type: String }],
  sentimentScore: { type: Number },
  sentimentLabel: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' }
}, { timestamps: true });

const FeedbackSchema = new Schema<IFeedback>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  source: { 
    type: String, 
    enum: ['Internal', 'External', 'Mentor', 'Investor', 'Public'], 
    required: true 
  },
  authorName: { type: String, required: true },
  authorEmail: { type: String },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  sentimentLabel: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
  suggestions: { type: String }
}, { timestamps: true });

export const Survey = model<ISurvey>('Survey', SurveySchema);
export const SurveyResponse = model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
export const InterviewLog = model<IInterviewLog>('InterviewLog', InterviewLogSchema);
export const Feedback = model<IFeedback>('Feedback', FeedbackSchema);
