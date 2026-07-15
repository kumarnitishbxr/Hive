import { Request, Response } from 'express';
import { Workspace, Page } from '../models/Workspace';

export const createPage = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { workspaceId, title, content, parentPageId, isFolder } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required.' });
    }

    const page = new Page({
      workspaceId,
      title: title || (isFolder ? 'New Folder' : 'Untitled Document'),
      content: content || '',
      parentPageId: parentPageId || undefined,
      isFolder: !!isFolder,
      createdBy: req.user.id
    });

    await page.save();
    res.status(201).json({ message: 'Page created successfully.', page });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create page.' });
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const workspaces = await Workspace.find({ startupId }).populate('createdBy', 'fullName email');
    res.status(200).json({ workspaces });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve workspaces.' });
  }
};

export const getPages = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required.' });
    }

    // Retrieve all pages and sort
    const pages = await Page.find({ workspaceId }).sort({ isFolder: -1, createdAt: 1 });
    res.status(200).json({ pages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pages.' });
  }
};

export const getPageDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = await Page.findById(id).populate('createdBy', 'fullName email');
    if (!page) {
      return res.status(404).json({ error: 'Page not found.' });
    }
    res.status(200).json({ page });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve page details.' });
  }
};

export const updatePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, blocks } = req.body;

    const page = await Page.findByIdAndUpdate(
      id,
      { $set: { title, content, blocks } },
      { new: true }
    );

    if (!page) {
      return res.status(404).json({ error: 'Page not found.' });
    }

    res.status(200).json({ message: 'Page updated successfully.', page });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update page.' });
  }
};

export const deletePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Recursively delete subpages if it's a folder
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found.' });
    }

    if (page.isFolder) {
      await Page.deleteMany({ parentPageId: page._id });
    }

    await Page.findByIdAndDelete(id);
    res.status(200).json({ message: 'Page deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete page.' });
  }
};
