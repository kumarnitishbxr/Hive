import { Schema, Document, model } from 'mongoose';

export interface IMeetingNote {
  date: Date;
  summary: string;
  nextSteps?: string;
}

export interface IInvestor extends Document {
  startupId: Schema.Types.ObjectId;
  name: string;
  firm: string;
  email: string;
  stage: 'Prospect' | 'Contacted' | 'Pitching' | 'Due Diligence' | 'Commitment' | 'Closed';
  interestLevel: 'Low' | 'Medium' | 'High';
  expectedFunding?: number;
  actualFunding?: number;
  notes?: string;
  meetings: IMeetingNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISlideTelemetry {
  slideIndex: number;
  timeSpentSec: number;
  scrollDepthPercent: number;
}

export interface IPitchDeckTelemetry extends Document {
  startupId: Schema.Types.ObjectId;
  shareToken: string;
  viewerEmail?: string;
  viewerName?: string;
  slideAnalytics: ISlideTelemetry[];
  viewedAt: Date;
}

const MeetingNoteSchema = new Schema<IMeetingNote>({
  date: { type: Date, required: true },
  summary: { type: String, required: true },
  nextSteps: { type: String }
}, { _id: false });

const InvestorSchema = new Schema<IInvestor>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  name: { type: String, required: true },
  firm: { type: String, required: true },
  email: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ['Prospect', 'Contacted', 'Pitching', 'Due Diligence', 'Commitment', 'Closed'], 
    default: 'Prospect',
    index: true
  },
  interestLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  expectedFunding: { type: Number },
  actualFunding: { type: Number },
  notes: { type: String },
  meetings: [MeetingNoteSchema]
}, { timestamps: true });

const SlideTelemetrySchema = new Schema<ISlideTelemetry>({
  slideIndex: { type: Number, required: true },
  timeSpentSec: { type: Number, required: true },
  scrollDepthPercent: { type: Number, default: 100 }
}, { _id: false });

const PitchDeckTelemetrySchema = new Schema<IPitchDeckTelemetry>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  shareToken: { type: String, required: true, index: true },
  viewerEmail: { type: String },
  viewerName: { type: String },
  slideAnalytics: [SlideTelemetrySchema],
  viewedAt: { type: Date, default: Date.now }
});

export const Investor = model<IInvestor>('Investor', InvestorSchema);
export const PitchDeckTelemetry = model<IPitchDeckTelemetry>('PitchDeckTelemetry', PitchDeckTelemetrySchema);
