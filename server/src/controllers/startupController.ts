import { Request, Response } from 'express';
import Startup from '../models/Startup';
import { Member } from '../models/User';
import { Workspace, Department, Page } from '../models/Workspace';

export const bootstrapOnboarding = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User context is missing.' });
    }

    const {
      name,
      industry,
      stage,
      vision,
      mission,
      logoUrl,
      website,
      targetMarket,
      revenueModel,
      fundingStage,
      expectedTeamSize,
      businessLocation
    } = req.body;

    if (!name || !industry || !stage || !vision || !mission || !targetMarket || !revenueModel || !fundingStage || !expectedTeamSize || !businessLocation) {
      return res.status(400).json({ error: 'All onboarding fields must be completed.' });
    }

    // Create Startup Tenant
    const startup = new Startup({
      name,
      industry,
      stage,
      vision,
      mission,
      logoUrl,
      website,
      targetMarket,
      revenueModel,
      fundingStage,
      expectedTeamSize,
      businessLocation,
      canvas: {
        keyPartners: ['Seed Investors', 'Industry Mentors'],
        keyActivities: ['Product R&D', 'Customer Validation'],
        keyResources: ['Founder Core Team', 'Tech Infrastructure'],
        valuePropositions: [`Revolutionary software for ${industry} market.`],
        customerRelationships: ['Self-service', 'Direct Support Channels'],
        channels: ['Organic Web Search', 'Social Outlets'],
        customerSegments: ['Early Adopters', 'Tech Enthusiasts'],
        costStructure: ['Compute Costs', 'Staff Operations'],
        revenueStreams: ['Subscription SaaS Plans']
      },
      swot: {
        strengths: ['Highly agile core founders', 'Niche technical specialization'],
        weaknesses: ['Minimal marketing presence', 'Bootstrapped capital limitations'],
        opportunities: ['Emerging digital demand sectors', 'Strategic channel alliances'],
        threats: ['Established enterprise players', 'High compute hosting expenses']
      },
      competitors: [
        {
          name: 'Traditional Incumbents Corp',
          strengths: ['Massive distribution footprint', 'Strong cash buffers'],
          weaknesses: ['Sluggish feature development', 'Legacy interface design'],
          pricingModel: 'Flat enterprise custom quoting',
          marketShare: '65%',
          usp: 'Deep legacy integration contracts'
        }
      ]
    });

    await startup.save();

    // Create Founder Member record
    const member = new Member({
      startupId: startup._id,
      userId: req.user.id,
      role: 'Founder',
      permissions: ['read', 'write', 'admin']
    });
    await member.save();

    // Create Default Workspace
    const workspace = new Workspace({
      startupId: startup._id,
      name: `${name} Shared Hub`,
      description: 'Central wiki workspace for all documents, roadmaps, and meeting agendas.',
      createdBy: req.user.id
    });
    await workspace.save();

    // Create default Departments
    const depts = ['Engineering', 'Product Management', 'Growth & Marketing'];
    const createdDepts = [];
    for (const name of depts) {
      const dept = new Department({
        workspaceId: workspace._id,
        name
      });
      await dept.save();
      createdDepts.push(dept);
    }

    // Assign Engineering department to Founder for initial task allocation
    member.departmentId = createdDepts[0]._id as any;
    await member.save();

    // Create default "Getting Started" documentation page
    const introPage = new Page({
      workspaceId: workspace._id,
      title: '🚀 Launching Hive',
      isFolder: false,
      content: `Welcome to **${name}**'s shared workspaces.
      
Use this wiki to capture your:
- Value Propositions
- Product Roadmap Goals
- Team Agenda updates
      
Feel free to click edit and add new pages using the editor!`,
      createdBy: req.user.id
    });
    await introPage.save();

    res.status(201).json({
      message: 'Workspace successfully bootstrapped.',
      startup,
      workspace,
      departments: createdDepts,
      gettingStartedPageId: introPage._id
    });
  } catch (error) {
    console.error('Bootstrapping error:', error);
    res.status(500).json({ error: 'Failed to bootstrap startup workspace.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const startup = await Startup.findById(req.startupId);
    if (!startup) {
      return res.status(404).json({ error: 'Startup profile not found.' });
    }
    res.status(200).json({ startup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve startup profile.' });
  }
};

export const updateCanvas = async (req: Request, res: Response) => {
  try {
    const { canvas } = req.body;
    if (!canvas) {
      return res.status(400).json({ error: 'Canvas object is required.' });
    }

    const startup = await Startup.findByIdAndUpdate(
      req.startupId,
      { $set: { canvas } },
      { new: true }
    );

    res.status(200).json({ message: 'Canvas updated successfully.', startup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Business Model Canvas.' });
  }
};

export const updateSwot = async (req: Request, res: Response) => {
  try {
    const { swot } = req.body;
    if (!swot) {
      return res.status(400).json({ error: 'SWOT object is required.' });
    }

    const startup = await Startup.findByIdAndUpdate(
      req.startupId,
      { $set: { swot } },
      { new: true }
    );

    res.status(200).json({ message: 'SWOT matrix updated successfully.', startup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SWOT analysis.' });
  }
};

export const addCompetitor = async (req: Request, res: Response) => {
  try {
    const competitor = req.body;
    if (!competitor.name) {
      return res.status(400).json({ error: 'Competitor name is required.' });
    }

    const startup = await Startup.findByIdAndUpdate(
      req.startupId,
      { $push: { competitors: competitor } },
      { new: true }
    );

    res.status(200).json({ message: 'Competitor added successfully.', startup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add competitor.' });
  }
};
