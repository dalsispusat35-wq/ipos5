import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from '../models/UserModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ipos5_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '60m';

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
      }

      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Username atau password tidak valid.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Username atau password tidak valid.' });
      }

      const payload = {
        userId: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.json({
        success: true,
        message: 'Login berhasil!',
        data: {
          token,
          user: {
            username: user.username,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async me(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthenticated' });
      }
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async logout(req, res) {
    res.json({ success: true, message: 'Logout berhasil.' });
  }
}

export default new AuthController();
