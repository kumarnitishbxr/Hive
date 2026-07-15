import { Request, Response } from 'express';
import { Investor, PitchDeckTelemetry } from '../models/CRM';

export const createInvestor = async (req: Request, res: Response) => {
  try {
    const { name, firm, email, stage, interestLevel, expectedFunding, notes } = req.body;
    const startupId = req.startupId;

    if (!name || !firm || !email) {
      return res.status(400).json({ error: 'Name, Firm, and Email are required fields.' });
    }

    const investor = new Investor({
      startupId,
      name,
      firm,
      email,
      stage: stage || 'Prospect',
      interestLevel: interestLevel || 'Medium',
      expectedFunding,
      notes
    });

    await investor.save();
    res.status(201).json({ message: 'Investor profile created.', investor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create investor profile.' });
  }
};

export const getInvestors = async (req: Request, res: Response) => {
  try {
    const investors = await Investor.find({ startupId: req.startupId }).sort({ updatedAt: -1 });
    res.status(200).json({ investors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve investor pipeline.' });
  }
};

export const updateInvestor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const investor = await Investor.findOneAndUpdate(
      { _id: id, startupId: req.startupId },
      { $set: updates },
      { new: true }
    );

    if (!investor) {
      return res.status(404).json({ error: 'Investor not found or not in this workspace.' });
    }

    res.status(200).json({ message: 'Investor profile updated.', investor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update investor.' });
  }
};

export const addMeetingNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { summary, nextSteps, date } = req.body;

    if (!summary) {
      return res.status(400).json({ error: 'Meeting summary note is required.' });
    }

    const meetingDate = date ? new Date(date) : new Date();

    const investor = await Investor.findOneAndUpdate(
      { _id: id, startupId: req.startupId },
      { $push: { meetings: { summary, nextSteps, date: meetingDate } } },
      { new: true }
    );

    if (!investor) {
      return res.status(404).json({ error: 'Investor not found.' });
    }

    res.status(200).json({ message: 'Meeting note recorded.', investor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log meeting note.' });
  }
};

// Generates an anonymous Share Link token for tracking slide viewer stats
export const generateShareLink = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    res.status(200).json({
      shareToken: token,
      link: `${req.protocol}://${req.get('host')}/pitch-viewer/${token}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate share link.' });
  }
};

// Track pitch deck slide viewing events
export const submitSlideTelemetry = async (req: Request, res: Response) => {
  try {
    const { shareToken, viewerName, viewerEmail, slideAnalytics, startupId } = req.body;

    if (!shareToken || !slideAnalytics || !Array.isArray(slideAnalytics) || !startupId) {
      return res.status(400).json({ error: 'Invalid parameters. Token, analytics and startupId are required.' });
    }

    const telemetry = new PitchDeckTelemetry({
      startupId,
      shareToken,
      viewerName: viewerName || 'Anonymous Viewer',
      viewerEmail,
      slideAnalytics
    });

    await telemetry.save();
    res.status(201).json({ message: 'Telemetry metrics updated.', telemetry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log pitch deck analytics.' });
  }
};

export const getPitchDeckTelemetry = async (req: Request, res: Response) => {
  try {
    const telemetry = await PitchDeckTelemetry.find({ startupId: req.startupId }).sort({ viewedAt: -1 });
    res.status(200).json({ telemetry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve telemetry details.' });
  }
};
