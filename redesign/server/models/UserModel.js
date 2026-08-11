import BaseModel from './BaseModel.js';
import DbConnection from '../config/DbConnection.js';
import bcrypt from 'bcrypt';

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  async findByUsername(username) {
    const db = await DbConnection.getDb();
    const cleanUser = String(username || '').trim().toLowerCase();
    return await db.collection('users').findOne({ username: cleanUser });
  }

  async seedDefaultUsers() {
    try {
      const db = await DbConnection.getDb();
      const count = await db.collection('users').countDocuments();
      if (count === 0) {
        console.log('Seeding initial user accounts...');
        const salt = await bcrypt.genSalt(10);
        const initialUsers = [
          {
            username: 'admin',
            password_hash: await bcrypt.hash('admin123', salt),
            name: 'Super Administrator IT',
            role: 'SUPER_ADMIN',
            createdAt: new Date()
          },
          {
            username: 'sari',
            password_hash: await bcrypt.hash('sari123', salt),
            name: 'Sari Rahayu',
            role: 'SUPERVISOR',
            createdAt: new Date()
          },
          {
            username: 'dispatcher',
            password_hash: await bcrypt.hash('dispatch123', salt),
            name: 'Dispatcher Outbound',
            role: 'DISPATCHER',
            createdAt: new Date()
          },
          {
            username: 'operator',
            password_hash: await bcrypt.hash('operator123', salt),
            name: 'Operator Gate',
            role: 'OPERATOR',
            createdAt: new Date()
          }
        ];
        await db.collection('users').insertMany(initialUsers);
        console.log('Default users seeded successfully!');
      }
    } catch (e) {
      console.error('Failed to seed default users:', e.message);
    }
  }
}

export default new UserModel();
