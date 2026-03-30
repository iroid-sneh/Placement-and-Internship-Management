# 🎓 PIMS — Placement & Internship Management System

A full-stack **MERN** (MongoDB, Express.js, React, Node.js) web application designed to digitalize and streamline the college placement process. Built for **BCA 6th Semester Major Project (604)**.

---

## 📌 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [User Roles & Features](#user-roles--features)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [How to Run the Project](#how-to-run-the-project)
7. [Default Login Credentials](#default-login-credentials)
8. [API Reference](#api-reference)
9. [Testing the Project](#testing-the-project)
10. [Database Schema](#database-schema)
11. [Known Bugs Fixed](#known-bugs-fixed)
12. [Project Scope Assessment](#project-scope-assessment)

---

## 🧠 Project Overview

**PIMS** replaces manual placement processes (spreadsheets, paper records) with a **digital, role-based platform** that manages:

- Student profiles and resumes
- Company information
- Job & internship postings
- Application tracking
- Interview scheduling and status updates
- Placement reports and analytics

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS v3 |
| **Backend** | Node.js + Express.js v5 |
| **Database** | MongoDB (via Mongoose v9) |
| **Authentication** | JWT (jsonwebtoken) |
| **Password Hashing** | Argon2 |
| **File Upload** | Multer |
| **API Docs** | Swagger UI (`/api/documentation`) |
| **Icons** | Lucide React |

---

## 👥 User Roles & Features

### 🧑‍🎓 Student
- Register/Login with email and password
- Complete profile (enrollment number, department, year, CGPA, phone)
- Manage skills (add/remove)
- Upload/delete PDF resume (max 5MB)
- Browse open jobs/internships (search by title or company)
- Apply to jobs (requires resume)
- Track application status (Applied → Shortlisted → Interview Scheduled → Selected/Rejected)
- View dashboard with stats: Applications, Interviews, Offers, Profile Score

### 🛡️ Admin
- Separate login at `/admin/login`
- Manage Students: view list, view individual profiles, delete (cascading)
- Manage Companies: full CRUD (Create, Read, Update, Delete)
- Manage Jobs/Internships: full CRUD
- Track all Applications: view, update status, schedule interviews
- Interview Management: table view + calendar view of all interviews
- Placement Reports: summary statistics, bar chart, pie chart
- Export reports

### 🏢 Company
- Login and view own job postings
- Post New Jobs / Edit / Delete company job listings
- View applicants who applied for their jobs
- Update applicant status (Shortlisted, Interview Scheduled, Selected, Rejected)
- Kanban board view of applicants by stage

---

## 📁 Project Structure

```
Placement-and-Internship-Management/
├── client/                         # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx                 # Main app with custom SPA routing
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Authentication state management
│   │   ├── services/
│   │   │   └── api/
│   │   │       ├── client.ts       # Base fetch wrapper (API base URL config)
│   │   │       ├── auth.ts         # Auth API calls
│   │   │       ├── student.ts      # Student API calls
│   │   │       ├── admin.ts        # Admin API calls
│   │   │       └── company.ts      # Company API calls
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── AdminLoginPage.tsx
│   │   │   ├── student/            # Student-facing pages
│   │   │   ├── admin/              # Admin-facing pages
│   │   │   └── company/            # Company-facing pages
│   │   ├── components/
│   │   │   ├── layout/             # DashboardLayout, Sidebar
│   │   │   └── ui/                 # Reusable UI components
│   │   └── types/                  # TypeScript type definitions
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                         # Node.js + Express Backend
│   ├── app.js                      # Entry point, Express setup, CORS, routes
│   ├── .env                        # ⚠️ Environment variables (create this!)
│   ├── controllers/
│   │   ├── authController.js       # Register, Login
│   │   ├── studentController.js    # Profile, Resume, Jobs, Applications
│   │   ├── adminController.js      # Students, Companies, Jobs, Reports
│   │   └── companyController.js    # Company Jobs, Applicants
│   ├── models/
│   │   ├── connection.js           # MongoDB connection
│   │   ├── user.js                 # User model (students/companies)
│   │   ├── admin.js                # Admin model
│   │   ├── studentProfile.js       # Student profile model
│   │   ├── company.js              # Company model
│   │   ├── job.js                  # Job/Internship model
│   │   └── application.js          # Application model
│   ├── middleware/
│   │   ├── auth.js                 # verifyJWT, authorizeRoles
│   │   └── upload.js               # Multer config for resume upload
│   ├── routes/
│   │   ├── index.js                # Root router (logs request duration)
│   │   ├── api.js                  # /api/* routes
│   │   ├── authRoutes.js           # Auth routes
│   │   ├── studentRoutes.js        # Student routes
│   │   ├── adminRoutes.js          # Admin routes
│   │   ├── companyRoutes.js        # Company routes
│   │   └── admin.js                # /admin/login route
│   ├── seeder/
│   │   └── index.js                # Auto-seeds default admin on first start
│   ├── src/common/
│   │   ├── authHelper.js           # JWT generate/verify, Argon2 hash/verify
│   │   ├── constants/constant.js   # JWT secret, token expiry constants
│   │   ├── config/swagger.js       # Swagger docs setup
│   │   └── middleware/errorHandler.js
│   ├── swagger.yaml                # OpenAPI/Swagger spec
│   ├── public/
│   │   └── resumes/                # Uploaded resume files stored here
│   └── package.json
│
├── plan.md                         # Project completion checklist
├── requiernment.md                 # Project requirements document
└── README.md                       # This file
```

---

## ✅ Prerequisites

Before running this project, ensure you have:

- **Node.js** v18 or higher → [Download](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **MongoDB** — either:
  - **Local**: Install MongoDB Community Server → [Download](https://www.mongodb.com/try/download/community)
  - **Cloud (Atlas)**: Free tier at [mongodb.com/atlas](https://www.mongodb.com/atlas) (recommended for quick setup)
- **Git** (optional, for cloning)

Verify installations:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show v9.x.x or higher
mongod --version  # If using local MongoDB
```

---

## 🚀 How to Run the Project

### Step 1: Configure the Server Environment

The server requires a `.env` file. One has already been created at `server/.env`. Open it and update the values:

```env
# server/.env
MONGO_DB_URL=Your MongoDB URI   # ← Change to your MongoDB URI
JWT_SECRET=pims_super_secret_jwt_key_change_in_production  # ← Change this!
BASE_URL=http://localhost
PORT=5001
NODE_ENV=development
```

> **For MongoDB Atlas (cloud):** Replace `MONGO_DB_URL` with your Atlas connection string, e.g.:
> `MONGO_DB_URL=mongodb+srv://username:password@cluster.mongodb.net/pims`

---

### Step 2: Install Server Dependencies

```bash
cd server
npm install
```

---

### Step 3: Start the Backend Server

```bash
cd server
npm start
```

You should see:
```
Admin Seeded           ← Only on first run (creates default admin)
Connected to MongoDB
Listening on http://localhost:5001
```

> ⚠️ The server runs on port **5001** by default. Keep this terminal open.

---

### Step 4: Install Client Dependencies

Open a **new terminal window**:

```bash
cd client
npm install
```

---

### Step 5: Start the Frontend

```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 6: Open in Browser

Visit: **http://localhost:5173**

---

## 🔑 Default Login Credentials

> These are automatically created when the server starts for the first time.

### Admin
| Field | Value |
|-------|-------|
| URL | http://localhost:5173 → Click "Admin Login" |
| Email | `admin@gmail.com` |
| Password | `admin@123` |

### Student (Register First)
1. Go to http://localhost:5173
2. Click **"Register"**
3. Select role **"Student"**
4. Fill in Name, Email, Password
5. Login with those credentials

### Company (Register First)
1. Go to http://localhost:5173
2. Click **"Register"**
3. Select role **"Company"**
4. Fill in Name, Email, Password
5. Login with those credentials

---

## 📡 API Reference

The backend runs at: `http://localhost:5001`

### Interactive API Documentation (Swagger)
Visit: **http://localhost:5001/api/documentation**

### Auth Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register student or company | None |
| POST | `/api/auth/login` | Login student or company | None |
| POST | `/admin/login` | Admin login | None |

### Student Endpoints (requires Bearer token with `student` role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/profile` | Get own profile |
| PUT | `/api/student/profile` | Update profile |
| POST | `/api/student/resume` | Upload resume (multipart/form-data) |
| DELETE | `/api/student/resume` | Delete resume |
| GET | `/api/student/jobs` | Browse open jobs |
| POST | `/api/student/apply/:jobId` | Apply to a job |
| GET | `/api/student/applications` | View own applications |

### Admin Endpoints (requires Bearer token with `admin` role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/students` | List all students |
| DELETE | `/api/admin/students/:id` | Delete student (cascading) |
| POST | `/api/admin/companies` | Create company |
| GET | `/api/admin/companies` | List all companies |
| PUT | `/api/admin/companies/:id` | Update company |
| DELETE | `/api/admin/companies/:id` | Delete company (cascading) |
| POST | `/api/admin/jobs` | Create job posting |
| GET | `/api/admin/jobs` | List all jobs |
| PUT | `/api/admin/jobs/:id` | Update job |
| DELETE | `/api/admin/jobs/:id` | Delete job (cascading) |
| GET | `/api/admin/applications` | View all applications |
| PUT | `/api/admin/applications/:id/status` | Update application status |
| GET | `/api/admin/reports/summary` | Get placement summary stats |

### Company Endpoints (requires Bearer token with `company` role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/company/jobs` | View own job postings |
| POST | `/api/company/jobs` | Create job posting |
| PUT | `/api/company/jobs/:id` | Update job posting |
| DELETE | `/api/company/jobs/:id` | Delete job posting |
| GET | `/api/company/applicants` | View applicants for own jobs |
| PUT | `/api/company/applicants/:id/status` | Update applicant status |

---

## 🧪 Testing the Project

### Manual Testing Workflow

#### Test the Full Student Flow:
1. **Register** as a student
2. **Login** with student role
3. Go to **Edit Profile** → Fill in enrollment number, department, CGPA, phone, skills → Save
4. Go to **Resume** → Upload a PDF file
5. Go to **Browse Jobs** → Search/filter jobs
6. Click on a job → **Apply** (button is enabled only if resume is uploaded)
7. Go to **My Applications** → Confirm your application appears with status "Applied"

#### Test the Full Admin Flow:
1. **Login** as Admin (`admin@gmail.com` / `admin@123`)
2. Go to **Company Management** → Add a new company (Name, HR Name, Email, Phone, Location)
3. Go to **Job Management** → Add a job for that company
4. Go to **Application Tracking** → Find the student's application
5. Click **Update Status** → Change to "Shortlisted"
6. Change status to "Interview Scheduled" and set an interview date
7. Go to **Interview Management** → Verify the interview appears in the table and calendar
8. Change status to "Selected" or "Rejected"
9. Go to **Reports** → Verify stats and charts update correctly

#### Test the Full Company Flow:
1. **Register** as a Company
2. **Login** with company role
3. Go to **Job Postings** → Post a new job
4. Go to **Applicants** → View students who applied
5. Update applicant status from the dropdown

#### Test Resume Upload:
1. Login as a student
2. Go to Resume Management
3. Upload a PDF (must be ≤ 5MB)
4. Verify the resume URL appears
5. Delete the resume and verify it's gone

#### Test Cascading Deletes (Admin):
1. Create a company → Create a job → Have a student apply
2. Delete the company → Verify: company, its jobs, and all applications are removed
3. Delete a student → Verify: student user, profile, and applications are removed

### API Testing with Postman / Thunder Client

1. **Register a student:**
   ```
   POST http://localhost:5001/api/auth/register
   Content-Type: application/json

   { "name": "John Doe", "email": "student@test.com", "password": "Test@123", "role": "student" }
   ```

2. **Login:**
   ```
   POST http://localhost:5001/api/auth/login
   Content-Type: application/json

   { "email": "student@test.com", "password": "Test@123" }
   ```
   → Copy the `token` from the response.

3. **Get profile (use token from step 2):**
   ```
   GET http://localhost:5001/api/student/profile
   Authorization: Bearer <your-token-here>
   ```

4. **Admin login:**
   ```
   POST http://localhost:5001/admin/login
   Content-Type: application/json

   { "email": "admin@gmail.com", "password": "admin@123" }
   ```

---

## 🗄️ Database Schema

### users
```
_id, name, email, password (argon2 hashed), role (student|company), isActive, createdAt, updatedAt
```

### admins
```
_id, email, password (argon2 hashed), createdAt, updatedAt
```

### studentprofiles
```
_id, userId (→ users), enrollmentNumber, department, year, phone, cgpa, skills (array), resumeUrl, createdAt, updatedAt
```

### companies
```
_id, name, hrName, email, phone, location, userId (→ users, optional for admin-created), createdAt, updatedAt
```

### jobs
```
_id, companyId (→ companies), title, description, type (Job|Internship), eligibility, packageOrStipend, lastDate, status (Open|Closed), createdAt, updatedAt
```

### applications
```
_id, studentId (→ users), jobId (→ jobs), status (Applied|Shortlisted|Interview Scheduled|Selected|Rejected), interviewDate, createdAt, updatedAt
[Unique compound index on: studentId + jobId]
```

---

## 🐛 Known Bugs Fixed

| # | Bug | Location | Fix Applied |
|---|-----|----------|-------------|
| 1 | **Missing `.env` file** — Server couldn't start without `MONGO_DB_URL`, `JWT_SECRET`, `BASE_URL`, `PORT` | `server/.env` | Created `.env` file with default values |
| 2 | **Spurious `undefined` npm dependency** — `"undefined": "^0.1.0"` was listed as a real package | `server/package.json` | Removed the bogus dependency |
| 3 | **Async bug in `mongoConnection()`** — Used `.then()/.catch()` inside `try/catch` making the error handler useless | `server/models/connection.js` | Converted to proper `async/await` |
| 4 | **Unused variable `insert` in seeder** | `server/seeder/index.js` | Removed the unused variable assignment |
| 5 | Company Dashboard - Schedule Interview and Reject buttons non-functional | Company dashboard | Fixed (per project changelog) |
| 6 | Interview Calendar showed hardcoded demo data instead of real interviews | Admin interview page | Fixed (per project changelog) |

---

## 📊 Project Scope Assessment (for 100-mark exam)

This project is **well-suited for a BCA 6th semester major project examination**. Here's a breakdown:

### ✅ Strong Points
| Category | Details |
|----------|---------|
| **MERN Stack** | Full MERN implementation — all 4 technologies used properly |
| **3 User Roles** | Student, Admin, Company — each with distinct dashboards and permissions |
| **Full CRUD** | Students, Companies, Jobs, Applications all have Create/Read/Update/Delete |
| **Authentication** | JWT with role-based access control, Argon2 password hashing |
| **File Upload** | Multer-based resume upload with validation and cleanup |
| **Data Visualization** | Bar chart (applications), Pie chart (placed/unplaced) in reports |
| **Cascading Deletes** | Proper data integrity (deleting a company removes its jobs and applications) |
| **API Documentation** | Swagger/OpenAPI documentation at `/api/documentation` |
| **TypeScript** | Frontend uses TypeScript for type safety |
| **Responsive UI** | Mobile-responsive layout with Tailwind CSS |
| **Error Handling** | try/catch on all endpoints with proper HTTP status codes |
| **Validation** | Server-side: required field checks, duplicate prevention, role validation |

### ⚠️ Limitations (Acceptable for College Project)
- No real-time notifications (Socket.io)
- No email integration (nodemailer is installed but not wired to send emails yet)
- Basic reporting (no advanced analytics)
- No automated unit/integration tests
- JWT is stored in localStorage (production concern, acceptable for college)

### 📈 Verdict
> **This project is comprehensive enough for a 100-mark exam.** It demonstrates all major MERN stack concepts, implements real-world features, has 3 roles with separate dashboards, proper auth, file uploads, and data visualization. The code is well-structured, modular, and follows good practices.

---

## 📞 Troubleshooting

### Server won't start
- ✅ Check that `server/.env` exists with correct values
- ✅ Check MongoDB is running: `mongod --version`
- ✅ Check port 5001 is not in use: `netstat -ano | findstr :5001` (Windows)

### Frontend cannot connect to backend
- ✅ Ensure server is running on port 5001
- ✅ Client is hardcoded to `http://localhost:5001` in `client/src/services/api/client.ts`

### MongoDB connection fails
- ✅ For local MongoDB: ensure MongoDB service is running
- ✅ For Atlas: ensure your IP is whitelisted in Atlas Network Access
- ✅ Check `MONGO_DB_URL` format in `.env`

### Admin login not working
- ✅ The admin is auto-seeded **only on first server start** (when no admin exists in DB)
- ✅ Default credentials: `admin@gmail.com` / `admin@123`
- ✅ Use the **Admin Login** button (not the regular login)

### Resume upload fails
- ✅ Only PDF files are accepted
- ✅ Max file size is 5MB
- ✅ Ensure `server/public/resumes/` directory exists (created automatically by multer)