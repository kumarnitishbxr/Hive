import { Request, Response } from 'express';
import { DocumentModel } from '../models/Document';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
    const { name, category, sizeBytes, url } = req.body;
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
      ocrStatus: 'Pending'
    });

    await document.save();

    // Trigger Mock OCR process asynchronously
    // Simulate background BullMQ worker
    setTimeout(async () => {
      try {
        let mockOcrText = '';
        if (category === 'NDA') {
          mockOcrText = 'MUTUAL NON-DISCLOSURE AGREEMENT. This agreement is made between Party A and Party B to safeguard confidential business strategies, cap tables, intellectual property disclosures, and strategic codes.';
        } else if (category === 'CapTable') {
          mockOcrText = 'CAPITALIZATION TABLE. Total Authorized Shares: 10,000,000. Founder Allocation: 6,000,000 (60%). Employee Option Pool: 1,500,000 (15%). Angel Round Investor: 2,500,000 (25%).';
        } else {
          mockOcrText = `OCR Extraction successful for file "${name}". Contains general corporate records and operational parameters.`;
        }

        await DocumentModel.findByIdAndUpdate(document._id, {
          $set: {
            ocrText: mockOcrText,
            ocrStatus: 'Completed'
          }
        });
        console.log(`[Mock OCR Engine] Parsed document: ${name}`);
      } catch (err) {
        await DocumentModel.findByIdAndUpdate(document._id, { $set: { ocrStatus: 'Failed' } });
        console.error('Mock OCR failed', err);
      }
    }, 4000); // 4 seconds delay to mimic asynchronous worker queue processing

    res.status(201).json({ 
      message: 'Document uploaded. Background OCR processing has started.',
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
