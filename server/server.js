const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Create default users if they don't exist
const createDefaultUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultUsers = [
        {
          username: process.env.VITE_DEFAULT_ADMIN_USERNAME || 'admin',
          password: process.env.VITE_DEFAULT_ADMIN_PASSWORD || 'admin123',
          role: 'admin'
        },
        {
          username: process.env.VITE_DEFAULT_MANAGER_USERNAME || 'manager',
          password: process.env.VITE_DEFAULT_MANAGER_PASSWORD || 'manager123',
          role: 'manager'
        },
        {
          username: process.env.VITE_DEFAULT_DEVELOPER_USERNAME || 'developer',
          password: process.env.VITE_DEFAULT_DEVELOPER_PASSWORD || 'dev123',
          role: 'developer'
        }
      ];

      for (const userData of defaultUsers) {
        const user = new User(userData);
        await user.save();
      }

      console.log('Default users created successfully');
    }
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

// Initialize default users
createDefaultUsers();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/months', require('./routes/months'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/students', require('./routes/students'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/references', require('./routes/references'));

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});