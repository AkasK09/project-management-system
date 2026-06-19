# Project Management System (SaaS)

A modern full-stack Project Management System built with React (Vite) and Node.js/Express, tailored for seamless task and project management.

## Tech Stack
**Frontend:** React, Vite, Tailwind CSS, React Router DOM, Axios, React Hook Form, Lucide React
**Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL, JWT, bcryptjs
**Deployment:** Vercel (Frontend), Render (Backend & PostgreSQL)

---

## 🛠️ Setup Instructions

### 1. Database Setup
Ensure you have PostgreSQL running locally or use a cloud database. Then, inside your `backend/` directory, create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/project_management"
JWT_SECRET="your_jwt_secret_key"
PORT=5000
```
Run migrations:
```bash
cd backend
npx prisma db push
```

### 2. Run Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Run Frontend
Inside the `frontend/` directory, map your env variable if using a different API URL:
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
Run dev server:
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 API Documentation

| Method | Endpoint             | Description                | Auth Required |
|--------|----------------------|----------------------------|---------------|
| POST   | `/api/auth/register` | Register a new user        | No            |
| POST   | `/api/auth/login`    | Authenticate user          | No            |
| POST   | `/api/auth/logout`   | Log out                    | No            |
| GET    | `/api/projects`      | Get all projects           | Yes           |
| POST   | `/api/projects`      | Create a new project       | Yes           |
| PUT    | `/api/projects/:id`  | Edit project details       | Yes           |
| DELETE | `/api/projects/:id`  | Delete a project           | Yes           |
| GET    | `/api/tasks`         | Get all tasks              | Yes           |
| POST   | `/api/tasks`         | Create a task under a proj | Yes           |
| PUT    | `/api/tasks/:id`     | Edit task                  | Yes           |
| DELETE | `/api/tasks/:id`     | Delete task                | Yes           |
| GET    | `/api/dashboard`     | Get dashboard statistics   | Yes           |

---

## 🚀 Deployment Guide

### PostgreSQL (Render)
1. Go to Render and create a new PostgreSQL database.
2. Copy the Internal Database URL connection string for the backend deployment.

### Render (Backend)
1. Link your GitHub repository.
2. Create standard Web Service, build command: `npm install && npx prisma generate && npx prisma migrate deploy`
3. Start command: `node src/server.js`
4. Set Environment Variables (`DATABASE_URL`, `JWT_SECRET`).

### Vercel (Frontend)
1. Link your GitHub repository.
2. Add your Render backend URL to `VITE_API_URL`.
3. Vercel automatically deploys Vite projects smoothly.
