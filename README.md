# Modern Task Management System

A comprehensive, full-stack Task and Project Management application built to streamline team collaboration. Designed with a robust Role-Based Access Control (RBAC) architecture, this platform empowers Managers to oversee projects and resources, while providing Employees with an intuitive Kanban interface to manage their daily workflows.

This project was built from the ground up focusing on real-world usability, clean user interfaces, and secure backend architecture.

## 🚀 Key Features

### 👥 Role-Based Access Control
- **Manager Role:** Full administrative privileges. Can create projects, add team members, manage all users, create tasks, edit/delete tasks, and view global analytics.
- **Employee Role:** Focused workflow privileges. Can view assigned projects, manage personal tasks via drag-and-drop, and update task statuses.

### 📋 Interactive Kanban Board
- Visual task management with `To Do`, `In Progress`, and `Completed` columns.
- Seamless drag-and-drop functionality for updating task statuses instantly.
- Task prioritization badges (High, Medium, Low) and assignee avatars for quick identification.
- Dynamic filtering by Project and Assignee.

### 📊 Dynamic Analytics Dashboard
- Real-time data visualization using responsive Pie Charts.
- **"Due Soon & Overdue"** widget for urgent task tracking.
- Aggregated statistics (Total Projects, Pending Tasks, Completed Tasks, etc.) based on the user's role.

### 🔔 Smart Notification System
- Alert indicators for urgent deadlines (tasks due within 48 hours or overdue).
- System alerts when an employee is onboarded to a new project.

### 🔒 Security & Authentication
- Secure JWT-based stateless authentication.
- Password hashing via `bcrypt`.
- Protected frontend routes to prevent unauthorized access.

---

## 🛠️ Technology Stack

**Frontend:**
- React 18 (via Vite for lightning-fast HMR)
- Tailwind CSS (Utility-first responsive styling)
- React Router DOM (Client-side routing)
- Recharts (Data visualization)
- @hello-pangea/dnd (Drag and drop interactions)
- date-fns (Date formatting and calculations)

**Backend:**
- Node.js & Express.js
- Prisma ORM (Type-safe database queries and migrations)
- MySQL (Relational Database)
- JSON Web Tokens (JWT) for secure auth sessions
- CORS & dotenv for environment management

---

## 💻 Local Setup & Installation

Follow these steps to run the project locally on your machine.

### Prerequisites
- Node.js (v18 or higher)
- MySQL Server (Running locally or remotely)
- Git

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd task-manager-fullstack
```

### 2. Backend Setup
```bash
cd Backend
npm install
```
- Create a `.env` file in the `Backend` directory and add your variables:
  ```env
  PORT=5000
  DATABASE_URL="mysql://username:password@localhost:3306/task_management"
  JWT_SECRET="your_secure_secret_key_here"
  ```
- Run database migrations and start the server:
  ```bash
  npx prisma db push
  npm run dev
  ```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd Frontend
npm install
```
- Create a `.env` file in the `Frontend` directory:
  ```env
  VITE_API_URL="http://localhost:5000/api/v1"
  ```
- Start the frontend development server:
  ```bash
  npm run dev
  ```

---

## ☁️ Deployment

This repository is structured as a Monorepo and is fully ready for deployment on platforms like Railway, Render, or Vercel.

**For Railway:**
1. Provision a MySQL Database on Railway.
2. Deploy the Backend service by setting the `Root Directory` to `/Backend` and providing the `DATABASE_URL` and `JWT_SECRET` environment variables. 
3. Deploy the Frontend service by setting the `Root Directory` to `/Frontend` and providing the `VITE_API_URL` environment variable pointing to your deployed backend.

---

## 🎯 Architecture & Design Decisions

- **Monorepo Structure:** Keeping the frontend and backend in a single repository ensures that full-stack feature branches and pull requests are self-contained.
- **Prisma ORM:** Chosen over raw SQL or Mongoose for its exceptional type safety, auto-generated queries, and easy schema migrations.
- **Stateless Auth:** JWT was selected over session-cookies to allow the backend API to scale horizontally and potentially serve mobile clients in the future.
- **Custom CSS Variables:** Tailwind was extended using standard CSS variables (`--color-primary`, `--color-bg`) to allow for effortless future implementation of Dark Mode/Light Mode toggling.

---
*Built as a comprehensive assignment to demonstrate proficiency in Full-Stack Web Development, API Design, and Database Modeling.*
