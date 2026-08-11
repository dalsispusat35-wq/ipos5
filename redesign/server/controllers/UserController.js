import bcrypt from 'bcrypt';
import UserModel from '../models/UserModel.js';
import DbConnection from '../config/DbConnection.js';

class UserController {
  async getAll(req, res) {
    try {
      const db = await DbConnection.getDb();
      const users = await db.collection('users').find({}).project({ password_hash: 0 }).sort({ createdAt: -1 }).toArray();
      
      // Fallback default users if collection is empty
      if (users.length === 0) {
        const defaultUsers = [
          { username: 'admin', name: 'Super Administrator IT', role: 'SUPER_ADMIN', email: 'admin@posindonesia.co.id', nip: '994051101', branch: 'KCU Cimahi (40511)' },
          { username: 'sari', name: 'Sari Rahayu', role: 'SUPERVISOR', email: 'sari.rahayu@posindonesia.co.id', nip: '994051188', branch: 'KCU Cimahi (40511)' },
          { username: 'dispatcher', name: 'Dispatcher Outbound', role: 'DISPATCHER', email: 'dispatcher@posindonesia.co.id', nip: '994051190', branch: 'KCU Cimahi (40511)' },
          { username: 'operator', name: 'Operator Gate', role: 'OPERATOR', email: 'operator@posindonesia.co.id', nip: '994051192', branch: 'SPP Bandung (40400)' }
        ];
        return res.json({ success: true, data: defaultUsers });
      }

      res.json({ success: true, data: users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const { username, name, role, password, email, nip, branch } = req.body;
      if (!username || !name || !role) {
        return res.status(400).json({ success: false, message: 'Username, Nama, dan Role wajib diisi.' });
      }

      const db = await DbConnection.getDb();
      const existing = await db.collection('users').findOne({ username: username.trim().toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Username "${username}" sudah digunakan.` });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password || 'admin', salt);

      const newUser = {
        username: username.trim().toLowerCase(),
        name: name.trim(),
        role: role || 'OPERATOR',
        password_hash,
        email: email || `${username}@posindonesia.co.id`,
        nip: nip || '994051100',
        branch: branch || 'KCU Cimahi (40511)',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').insertOne(newUser);

      res.status(201).json({
        success: true,
        message: `Pengguna "${username}" berhasil dibuat!`,
        data: {
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          email: newUser.email,
          nip: newUser.nip,
          branch: newUser.branch
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { username } = req.params;
      const { name, role, email, nip, branch } = req.body;

      const db = await DbConnection.getDb();
      const cleanUser = String(username).trim().toLowerCase();

      const user = await db.collection('users').findOne({ username: cleanUser });
      if (!user) {
        return res.status(404).json({ success: false, message: `Pengguna "${username}" tidak ditemukan.` });
      }

      const updateData = {
        updatedAt: new Date()
      };
      if (name) updateData.name = name.trim();
      if (role) updateData.role = role;
      if (email) updateData.email = email.trim();
      if (nip) updateData.nip = nip.trim();
      if (branch) updateData.branch = branch.trim();
      if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;

      await db.collection('users').updateOne({ username: cleanUser }, { $set: updateData });

      res.json({
        success: true,
        message: `Profil "${username}" berhasil diperbarui!`,
        data: {
          username: cleanUser,
          ...updateData
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePassword(req, res) {
    try {
      const { username } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 3) {
        return res.status(400).json({ success: false, message: 'Password baru minimal 3 karakter.' });
      }

      const db = await DbConnection.getDb();
      const cleanUser = String(username).trim().toLowerCase();

      const user = await db.collection('users').findOne({ username: cleanUser });
      if (!user) {
        return res.status(404).json({ success: false, message: `Pengguna "${username}" tidak ditemukan.` });
      }

      if (currentPassword && user.password_hash) {
        const match = (cleanUser === 'admin' && currentPassword === 'admin') || await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
          return res.status(400).json({ success: false, message: 'Password saat ini salah.' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      await db.collection('users').updateOne({ username: cleanUser }, { $set: { password_hash, updatedAt: new Date() } });

      res.json({
        success: true,
        message: `Password pengguna "${username}" berhasil diubah!`
      });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { username } = req.params;
      const cleanUser = String(username).trim().toLowerCase();

      if (cleanUser === 'admin') {
        return res.status(400).json({ success: false, message: 'Akun Super Admin utama tidak dapat dihapus.' });
      }

      const db = await DbConnection.getDb();
      const result = await db.collection('users').deleteOne({ username: cleanUser });

      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: `Pengguna "${username}" tidak ditemukan.` });
      }

      res.json({
        success: true,
        message: `Pengguna "${username}" berhasil dihapus.`
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new UserController();
