import { Schema, Document, model } from 'mongoose';

export interface IBusinessModelCanvas {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

export interface ISwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ICompetitor {
  name: string;
  website?: string;
  strengths: string[];
  weaknesses: string[];
  pricingModel?: string;
  marketShare?: string; // e.g. "15%"
  usp?: string;
}

export interface IStartup extends Document {
  name: string;
  industry: string;
  stage: 'Idea' | 'Validation' | 'Prototype' | 'Traction' | 'Scaling';
  vision: string;
  mission: string;
  logoUrl?: string;
  website?: string;
  targetMarket: string;
  revenueModel: string;
  fundingStage: 'Pre-Seed' | 'Seed' | 'SeriesA' | 'SeriesB' | 'Bootstrapped';
  expectedTeamSize: number;
  businessLocation: string;
  canvas: IBusinessModelCanvas;
  swot: ISwotAnalysis;
  competitors: ICompetitor[];
  elevatorPitch?: string;
  targetUsers?: string[];
  valuePropositionSummary?: string;
  uspSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CanvasSchema = new Schema<IBusinessModelCanvas>({
  keyPartners: { type: [String], default: [] },
  keyActivities: { type: [String], default: [] },
  keyResources: { type: [String], default: [] },
  valuePropositions: { type: [String], default: [] },
  customerRelationships: { type: [String], default: [] },
  channels: { type: [String], default: [] },
  customerSegments: { type: [String], default: [] },
  costStructure: { type: [String], default: [] },
  revenueStreams: { type: [String], default: [] }
}, { _id: false });

const SwotSchema = new Schema<ISwotAnalysis>({
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  opportunities: { type: [String], default: [] },
  threats: { type: [String], default: [] }
}, { _id: false });

const CompetitorSchema = new Schema<ICompetitor>({
  name: { type: String, required: true },
  website: { type: String },
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  pricingModel: { type: String },
  marketShare: { type: String },
  usp: { type: String }
}, { _id: false });

const StartupSchema = new Schema<IStartup>({
  name: { type: String, required: true, trim: true },
  industry: { type: String, required: true },
  stage: { type: String, enum: ['Idea', 'Validation', 'Prototype', 'Traction', 'Scaling'], required: true },
  vision: { type: String, required: true },
  mission: { type: String, required: true },
  logoUrl: { type: String },
  website: { type: String },
  targetMarket: { type: String, required: true },
  revenueModel: { type: String, required: true },
  fundingStage: { type: String, enum: ['Pre-Seed', 'Seed', 'SeriesA', 'SeriesB', 'Bootstrapped'], required: true },
  expectedTeamSize: { type: Number, required: true },
  businessLocation: { type: String, required: true },
  canvas: {
    type: CanvasSchema,
    default: () => ({
      keyPartners: [],
      keyActivities: [],
      keyResources: [],
      valuePropositions: [],
      customerRelationships: [],
      channels: [],
      customerSegments: [],
      costStructure: [],
      revenueStreams: []
    })
  },
  swot: {
    type: SwotSchema,
    default: () => ({
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: []
    })
  },
  competitors: { type: [CompetitorSchema], default: [] },
  elevatorPitch: { type: String },
  targetUsers: { type: [String], default: [] },
  valuePropositionSummary: { type: String },
  uspSummary: { type: String }
}, { timestamps: true });

StartupSchema.index({ name: 'text' });

export default model<IStartup>('Startup', StartupSchema);
