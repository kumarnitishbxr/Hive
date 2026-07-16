import { Request, Response } from 'express';
import { DocumentModel } from '../models/Document';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { name, category, sizeBytes, url, ocrText } = req.body;
    const startupId = req.startupId;

    if (!name || !category || !url) {
      return res.status(400).json({ error: 'Name, Category, and URL are required.' });
    }

    const document = new DocumentModel({
      startupId,
      name,
      category,
      url,
      sizeBytes: sizeBytes || 1024,
      uploadedBy: req.user.id,
      ocrText: typeof ocrText === 'string' ? ocrText.trim() : '',
      ocrStatus: typeof ocrText === 'string' && ocrText.trim() ? 'Completed' : 'Unavailable'
    });

    await document.save();

    res.status(201).json({ 
      message: document.ocrStatus === 'Completed'
        ? 'Document uploaded with searchable OCR text.'
        : 'Document uploaded. OCR extraction is not configured in this environment.',
      document 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload document.' });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const query: any = { startupId: req.startupId };

    if (category) {
      query.category = category;
    }

    if (search) {
      // Perform text index match on title and ocrText
      query.$text = { $search: search as string };
    }

    const documents = await DocumentModel.find(query)
      .populate('uploadedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await DocumentModel.findOneAndDelete({ _id: id, startupId: req.startupId });

    if (!document) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    res.status(200).json({ message: 'Document successfully deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document.' });
  }
};
