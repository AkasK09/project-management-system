const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorMiddleware = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Global request logger middleware to debug mobile connectivity
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip} - Agent: ${req.get('user-agent')} - Origin: ${req.get('origin') || 'No Origin'}`
  );
  next();
});

app.use(
  cors({
    origin: [
      "https://project-management-system-lime-nine.vercel.app"
    ],
    credentials: true
  })
);

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorMiddleware);

module.exports = app;
