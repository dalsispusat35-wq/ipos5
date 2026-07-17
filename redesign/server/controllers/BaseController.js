class BaseController {
  constructor(model, idField) {
    this.model = model;
    this.idField = idField;
  }

  async getAll(req, res) {
    try {
      const { search, page, limit, sortField, sortOrder, ...filters } = req.query;
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
      const skip = (parsedPage - 1) * parsedLimit;
      
      // Build filter
      let filter = {};
      
      // Apply filters if any
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          filter[key] = value;
        }
      }

      // Handle search (subclasses can override)
      if (search && this.getSearchFilter) {
        filter = { ...filter, ...this.getSearchFilter(search) };
      }

      const total = await this.model.count(filter);
      
      const sort = {};
      if (sortField) {
        sort[sortField] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort[this.idField] = 1;
      }

      const data = await this.model.find(filter, {
        skip,
        limit: parsedLimit,
        sort
      });

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit)
        }
      });
    } catch (error) {
      console.error(`Error in getAll:`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const id = req.params.id;
      const data = await this.model.findOne({ [this.idField]: id });
      if (!data) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const doc = { ...req.body };
      if (this.model.generateNextId && !doc[this.idField]) {
        doc[this.idField] = await this.model.generateNextId();
      }
      const result = await this.model.insertOne(doc);
      res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', id: doc[this.idField], result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const updateData = { ...req.body };
      
      // Prevent id overwrite
      delete updateData[this.idField];
      delete updateData._id;

      const result = await this.model.updateOne({ [this.idField]: id }, updateData);
      if (!result.matchedCount) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }
      res.json({ success: true, message: 'Data berhasil diperbarui', result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const id = req.params.id;
      const result = await this.model.deleteOne({ [this.idField]: id });
      if (!result.deletedCount) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }
      res.json({ success: true, message: 'Data berhasil dihapus', result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default BaseController;
