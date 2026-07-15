import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Startup from './models/Startup';
import { User, Member } from './models/User';
import { Workspace, Department, Page } from './models/Workspace';
import { Project, Sprint } from './models/Project';
import { Task, TimeLog } from './models/Task';
import Milestone from './models/Milestone';
import { Survey, SurveyResponse, InterviewLog, Feedback } from './models/Validation';
import { Investor, PitchDeckTelemetry } from './models/CRM';
import { DocumentModel } from './models/Document';
import config from './config';

const MONGODB_URI = config.mongodbUri;
const seed = async () => {
  try {
    console.log('Seeding Demo Data...');
    await mongoose.connect(MONGODB_URI);
    
    // Clear existing collections
    await mongoose.connection.dropDatabase();
    console.log('Database cleared.');

    // 1. Create User
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({
      email: 'founder@startupops.co',
      passwordHash,
      fullName: 'Nitish Kumar',
      isVerified: true,
      status: 'Active'
    });
    await user.save();
    console.log('Seed: User created (founder@startupops.co / password123)');

    // 2. Create Startup
    const startup = new Startup({
      name: 'AlphaSpace AI',
      industry: 'Artificial Intelligence / SaaS',
      stage: 'Validation',
      vision: 'Empower developers to construct AI agents visually without complex orchestrations.',
      mission: 'Bring visual agentic programming to 10 million engineers globally.',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop',
      website: 'https://alphaspace.ai',
      targetMarket: 'B2B Software Development Teams',
      revenueModel: 'Usage-based SaaS Subscription',
      fundingStage: 'Pre-Seed',
      expectedTeamSize: 10,
      businessLocation: 'San Francisco, CA',
      canvas: {
        keyPartners: ['Cloud Hosting Providers', 'OpenAI API Developers', 'SaaS Bloggers'],
        keyActivities: ['Visual editor design', 'LLM orchestration pipeline', 'Community marketing'],
        keyResources: ['Agent runtime engine', 'Core engineering founders', 'Cloud infrastructure'],
        valuePropositions: ['Build autonomous AI agents in 5 minutes via drag-and-drop', 'Standardized execution telemetry dashboard'],
        customerRelationships: ['GitHub issues community support', 'Direct dedicated slack channels'],
        channels: ['Developer newsletters', 'ProductHunt launch', 'GitHub trending listings'],
        customerSegments: ['Startup solo developers', 'Enterprise R&D labs', 'Visual builders'],
        costStructure: ['OpenAI / Claude API tokens expense', 'High performance hosting', 'Staff salaries'],
        revenueStreams: ['Starter tier ($29/mo)', 'Enterprise workspace tier ($149/mo)', 'Custom token margins']
      },
      swot: {
        strengths: ['Visual pipeline engine complete', 'Highly dynamic Liquid Glass UI design', 'Low startup overhead'],
        weaknesses: ['Small brand footprint', 'No dedicated product developer', 'API cost dependency'],
        opportunities: ['Rapid growth in agent developer demand', 'Strategic accelerator opportunities'],
        threats: ['Direct competition from core LLM labs', 'Rising server compute costs']
      },
      competitors: [
        {
          name: 'FlowAgent Corp',
          strengths: ['Early market entry', 'Strong enterprise integrations'],
          weaknesses: ['Very steep learning curve', 'Outdated layout styling'],
          pricingModel: '$99/user/month flat',
          marketShare: '10%',
          usp: 'Enterprise active directory support'
        }
      ],
      elevatorPitch: 'The drag-and-drop workspace to construct, deploy and monitor autonomous AI agents.',
      targetUsers: ['Product developers', 'Tech founders', 'AI hobbyists'],
      valuePropositionSummary: 'No-code visual builders for agent workflows',
      uspSummary: 'Liquid Glass drag-and-drop visual execution engine'
    });
    await startup.save();
    console.log('Seed: Startup profile created');

    // 3. Member link
    const member = new Member({
      startupId: startup._id,
      userId: user._id,
      role: 'Founder',
      permissions: ['read', 'write', 'admin']
    });
    await member.save();

    // 4. Workspace & Departments
    const workspace = new Workspace({
      startupId: startup._id,
      name: 'AlphaSpace Core Hub',
      description: 'Shared Notion docs and Kanban trackers.',
      createdBy: user._id
    });
    await workspace.save();

    const depts = ['Engineering', 'Product Design', 'Growth & Marketing'];
    const createdDepts = [];
    for (const name of depts) {
      const dept = new Department({ workspaceId: workspace._id, name });
      await dept.save();
      createdDepts.push(dept);
    }
    console.log('Seed: Workspace and Departments created');

    // Assign Engineering to member
    member.departmentId = createdDepts[0]._id as any;
    await member.save();

    // 5. Notion Pages
    const page1 = new Page({
      workspaceId: workspace._id,
      title: '🎯 Strategic GTM Launch Plan',
      isFolder: false,
      content: `## AlphaSpace Launch Protocol
      
Our objective is to acquire 50 active pilot customers within 30 days of launch.
- Target Channel: HackerNews & ProductHunt
- Asset Package: Interactive live sandboxed demo page
- Community Strategy: Retrospective builder articles`,
      createdBy: user._id
    });
    await page1.save();
    console.log('Seed: Workspace Docs created');

    // 6. Project & Sprint
    const project = new Project({
      workspaceId: workspace._id,
      departmentId: createdDepts[0]._id,
      name: 'Visual Editor V1 Release',
      description: 'Milestones to assemble the visual drag-and-drop agent board.',
      status: 'Active',
      createdBy: user._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000)
    });
    await project.save();

    const sprint = new Sprint({
      projectId: project._id,
      name: 'Sprint 1: Core Drag-and-Drop Editor',
      goal: 'Enable visual node wiring and JSON template exports.',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      status: 'Active'
    });
    await sprint.save();
    console.log('Seed: Projects & Sprints configured');

    // 7. Tasks
    const task1 = new Task({
      workspaceId: workspace._id,
      projectId: project._id,
      sprintId: sprint._id,
      title: 'Develop drag-and-drop React canvas logic',
      description: 'Assembled the SVG rendering canvas with basic mouse listener nodes.',
      status: 'Done',
      priority: 'High',
      assignees: [user._id],
      reporter: user._id,
      estimatedHours: 12,
      actualHours: 14,
      labels: ['frontend', 'milestone-1']
    });
    await task1.save();

    const task2 = new Task({
      workspaceId: workspace._id,
      projectId: project._id,
      sprintId: sprint._id,
      title: 'Draft visual canvas layout spec in canvas model',
      description: 'Document key-value fields and mapping triggers.',
      status: 'Done',
      priority: 'Medium',
      assignees: [user._id],
      reporter: user._id,
      estimatedHours: 6,
      actualHours: 5,
      labels: ['strategic']
    });
    await task2.save();

    const task3 = new Task({
      workspaceId: workspace._id,
      projectId: project._id,
      sprintId: sprint._id,
      title: 'Connect AI stream endpoints to user panel',
      description: 'Stream back agentic response templates dynamically.',
      status: 'In Progress',
      priority: 'High',
      assignees: [user._id],
      reporter: user._id,
      estimatedHours: 8,
      actualHours: 2,
      dependencies: [task2._id], // Task 3 depends on Task 2 (already Done!)
      labels: ['backend', 'ai']
    });
    await task3.save();

    const task4 = new Task({
      workspaceId: workspace._id,
      projectId: project._id,
      sprintId: sprint._id,
      title: 'Polishing glassmorphism layout dashboard indicators',
      description: 'Add glows, backdrop-blurs, and keyframe mesh nodes.',
      status: 'Todo',
      priority: 'Low',
      assignees: [user._id],
      reporter: user._id,
      estimatedHours: 10,
      actualHours: 0,
      labels: ['design']
    });
    await task4.save();
    console.log('Seed: Sprints Tasks configured');

    // 8. Idea validation logs
    const interview1 = new InterviewLog({
      startupId: startup._id,
      customerName: 'Aarav Mehta',
      roleOrIndustry: 'Solo SaaS Builder',
      feedbackText: 'AlphaSpace is exactly what I need. Building agents inside Python using LangChain is incredibly slow. A visual editor lets me test agent loops and prompts instantly. Buying as soon as this launches!',
      painPoints: ['Complex LangChain boilerplate code', 'Slow testing iterations'],
      sentimentScore: 0.85,
      sentimentLabel: 'Positive'
    });
    await interview1.save();

    const interview2 = new InterviewLog({
      startupId: startup._id,
      customerName: 'Sarah Jenkins',
      roleOrIndustry: 'Enterprise Product Manager',
      feedbackText: 'The interface looks incredibly beautiful and intuitive. However, I am worried about enterprise compliance. Can we run this locally on our own AWS cluster, or is it cloud-only? Pricing seems high.',
      painPoints: ['Enterprise security compliance', 'Compute price transparency'],
      sentimentScore: 0.15,
      sentimentLabel: 'Neutral'
    });
    await interview2.save();

    const survey = new Survey({
      startupId: startup._id,
      title: 'Developer Tooling & AI Survey',
      description: 'Short survey to analyze developer pain points around AI agent builders.',
      questions: [
        { id: 'q1', question: 'How many hours do you spend writing agent code boilerplate?', type: 'multiple-choice', options: ['1-3 hrs', '4-8 hrs', '9+ hrs'] },
        { id: 'q2', question: 'Rate the severity of agent debugging loops (1-5)', type: 'rating' },
        { id: 'q3', question: 'Would you pay $29/mo for visual debugging?', type: 'multiple-choice', options: ['Yes', 'No', 'Maybe'] }
      ]
    });
    await survey.save();

    const response1 = new SurveyResponse({
      surveyId: survey._id,
      answers: [
        { questionId: 'q1', answer: '4-8 hrs' },
        { questionId: 'q2', answer: 5 },
        { questionId: 'q3', answer: 'Yes' }
      ],
      customerSegment: 'Startup Engineers'
    });
    await response1.save();

    const response2 = new SurveyResponse({
      surveyId: survey._id,
      answers: [
        { questionId: 'q1', answer: '9+ hrs' },
        { questionId: 'q2', answer: 4 },
        { questionId: 'q3', answer: 'Maybe' }
      ],
      customerSegment: 'Agency Builders'
    });
    await response2.save();
    console.log('Seed: Customer Interviews & Surveys compiled');

    // 9. Investor Relations
    const investor1 = new Investor({
      startupId: startup._id,
      name: 'David Sacks',
      firm: 'Craft Ventures',
      email: 'david@craftventures.com',
      stage: 'Pitching',
      interestLevel: 'High',
      expectedFunding: 250000,
      notes: 'Extremely interested in visual builder paradigm. Scheduled sandbox walkthrough.'
    });
    await investor1.save();

    const investor2 = new Investor({
      startupId: startup._id,
      name: 'Marc Andreessen',
      firm: 'a16z',
      email: 'marc@a16z.com',
      stage: 'Prospect',
      interestLevel: 'Medium',
      notes: 'Emailed value prop decks. Waiting on reply.'
    });
    await investor2.save();
    console.log('Seed: CRM Investor Pipeline configured');

    // 10. Documents
    const doc1 = new DocumentModel({
      startupId: startup._id,
      name: 'Delaware Incorporation Certificate.pdf',
      category: 'Incorporation',
      url: 'https://cloudinary.com/f/incorporation_delaware.pdf',
      sizeBytes: 421000,
      uploadedBy: user._id,
      ocrStatus: 'Completed',
      ocrText: 'CERTIFICATE OF INCORPORATION. File Number 7421890. Corporate name: AlphaSpace AI, Inc. Filed in Delaware state compliance directory.'
    });
    await doc1.save();

    const doc2 = new DocumentModel({
      startupId: startup._id,
      name: 'AlphaSpace Cap Sheet V1.pdf',
      category: 'CapTable',
      url: 'https://cloudinary.com/f/capsheet.pdf',
      sizeBytes: 154000,
      uploadedBy: user._id,
      ocrStatus: 'Completed',
      ocrText: 'AlphaSpace AI Capitalization Table. Common Stocks: Founder Nitish Kumar - 80%, Option Pool: 20%. Authorized shares list.'
    });
    await doc2.save();
    console.log('Seed: Cloud Files logged');

    // 11. Milestones
    const milestone1 = new Milestone({
      startupId: startup._id,
      title: 'Complete Visual Canvas Core Sandbox',
      description: 'Wiring mouse events, nodes, and mock outputs.',
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      status: 'Pending',
      progress: 66,
      riskIndicator: 'Low',
      associatedTasks: [task1._id, task2._id, task3._id] // task 1, 2 Done, task 3 In Progress
    });
    await milestone1.save();
    console.log('Seed: Roadmap Milestones registered');

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seed script failed:', error);
    mongoose.connection.close();
  }
};

seed();
