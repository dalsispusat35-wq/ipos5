import BaseController from './BaseController.js';
import NewsModel from '../models/NewsModel.js';
import NewsScraperService from '../services/NewsScraperService.js';

class NewsController extends BaseController {
  constructor() {
    super(NewsModel, '_id');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { title: regex },
        { summary: regex },
        { sourceName: regex }
      ]
    };
  }

  async getAll(req, res) {
    try {
      const { search, page, limit, isManual } = req.query;
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, parseInt(limit, 10) || 30);
      const skip = (parsedPage - 1) * parsedLimit;

      let filter = {};
      if (search) {
        filter = { ...filter, ...this.getSearchFilter(search) };
      }
      if (isManual !== undefined && isManual !== '') {
        filter.isManual = isManual === 'true';
      }

      const total = await this.model.count(filter);
      const data = await this.model.getAll({
        filter,
        skip,
        limit: parsedLimit,
        sort: { publishedAt: -1, createdAt: -1 }
      });

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit) || 1
        }
      });
    } catch (error) {
      console.error('Error in NewsController.getAll:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const id = req.params.id;
      const data = await this.model.getById(id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
      }
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error in NewsController.getById:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createManual(req, res) {
    try {
      const { title, imageUrl, summary, sourceUrl, sourceName, publishedAt } = req.body;
      if (!title || !String(title).trim()) {
        return res.status(400).json({ success: false, message: 'Judul berita wajib diisi' });
      }

      const newNews = {
        title: title.trim(),
        imageUrl: imageUrl ? imageUrl.trim() : '',
        summary: summary ? summary.trim() : '',
        sourceUrl: sourceUrl ? sourceUrl.trim() : '#',
        sourceName: sourceName ? sourceName.trim() : 'PT Pos Indonesia (Official)',
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        isManual: true
      };

      const result = await this.model.create(newNews);
      res.status(201).json({
        success: true,
        message: 'Berita manual berhasil ditambahkan',
        data: {
          _id: result.insertedId,
          ...newNews
        }
      });
    } catch (error) {
      console.error('Error in NewsController.createManual:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const updateData = { ...req.body };

      delete updateData._id;

      const result = await this.model.update(id, updateData);
      if (!result.matchedCount) {
        return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
      }

      res.json({ success: true, message: 'Berita berhasil diperbarui', result });
    } catch (error) {
      console.error('Error in NewsController.update:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const id = req.params.id;
      const result = await this.model.delete(id);
      if (!result.deletedCount) {
        return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
      }

      res.json({ success: true, message: 'Berita berhasil dihapus', result });
    } catch (error) {
      console.error('Error in NewsController.delete:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async triggerScrape(req, res) {
    try {
      const result = await NewsScraperService.scrapeNews();
      if (!result.success && result.message === 'DATABASE_NOT_CONNECTED') {
        return res.status(503).json(result);
      }
      res.json(result);
    } catch (error) {
      console.error('Error in NewsController.triggerScrape:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new NewsController();
