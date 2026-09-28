# Leave Management System

A full-stack Leave Management System that allows employees to apply for leave and track their leave balance and history, while administrators can manage employees, review leave requests, and manage employee leave balances.

## Overview

The Leave Management System provides a simple role-based platform for managing employee leave requests.

The system has two main roles:

- Employee
- Administrator

Employees can log in, apply for leave, view their leave balance, and track their leave history.

Administrators can manage employees, review pending leave requests, approve or reject requests, and adjust employee leave balances.

---

## Features

### Employee Features

- Employee login
- Apply for leave
- Select leave type
- Select start and end dates
- Enter leave reason
- Prevent leave applications for past dates
- Prevent overlapping pending or approved leave requests
- View available leave balance
- View leave history
- View pending, approved, and rejected leave requests
- Automatic leave balance deduction after approval

### Administrator Features

- Administrator login
- Admin dashboard
- View total employees
- View pending leave requests
- View approved leave requests
- View rejected leave requests
- View pending leave request details
- Approve leave requests
- Reject leave requests
- Add new employees
- View all employees
- Set initial leave balance for employees
- Credit employee leave balance
- Debit employee leave balance
- Require a reason for leave balance adjustments

### Security Features

- JWT-based authentication
- Role-based authorization
- Protected employee routes
- Protected administrator routes
- Password hashing using bcrypt
- Environment variables for sensitive configuration
- Passwords excluded from employee API responses

---

## Leave Workflow

```text
Employee Login
      |
      v
Employee Dashboard
      |
      v
Apply Leave
      |
      v
Pending Request
      |
      +-------------------+
      |                   |
      v                   v
   Approve              Reject
      |                   |
      v                   v
Balance Deducted       No Deduction
      |                   |
      +---------+---------+
                |
                v
          Leave History



System Architecture
+---------------------------+
|       React Frontend      |
|                           |
|  Employee Dashboard       |
|  Admin Dashboard          |
|  Login                    |
+-------------+-------------+
              |
              | REST API / Axios
              v
+---------------------------+
|       Express Backend     |
|                           |
| Authentication            |
| Leave Management          |
| Employee Management       |
| Balance Management        |
+-------------+-------------+
              |
              | Mongoose
              v
+---------------------------+
|       MongoDB Atlas       |
|                           |
| Users                     |
| Leave Requests            |
+---------------------------+


Technology Stack

Frontend
React
Vite
React Router
Axios
CSS
Backend
Node.js
Express.js
MongoDB
Mongoose
JSON Web Token (JWT)
bcryptjs
dotenv
CORS
Development Tools
Visual Studio Code
Git
GitHub
Postman
MongoDB Atlas

Project Structure


Leave-Management-System/
│
├── backend/
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── leaveController.js
│   │   └── adminController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Leave.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── leaveRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── scripts/
│   │   └── createAdmin.js
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md


Database Design
User

The User collection stores employee and administrator accounts.

Main fields:

name
email
password
role
leaveBalance
createdAt
updatedAt

Roles:

employee
admin
Leave

The Leave collection stores employee leave requests.

Main fields:

employee
leaveType
startDate
endDate
numberOfDays
reason
status
adminComment
reviewedBy
reviewedAt
createdAt
updatedAt

Leave statuses:

pending
approved
rejected
Authentication

The application uses JWT authentication.

After successful login:

Login
  |
  v
Backend validates credentials
  |
  v
JWT token generated
  |
  v
Token stored on frontend
  |
  v
Protected API requests

Passwords are hashed using bcryptjs before being stored in MongoDB.

API Endpoints
Authentication
Register Employee
POST /api/auth/register
Login
POST /api/auth/login
Get Current User
GET /api/auth/me

Requires authentication.

Employee Leave APIs
Apply Leave
POST /api/leaves

Requires employee authentication.

Get My Leave History
GET /api/leaves/my-leaves

Requires authentication.

Get My Leave Balance
GET /api/leaves/balance

Requires authentication.

Administrator Leave APIs
Get Pending Leave Requests
GET /api/leaves/admin/pending

Requires administrator authentication.

Approve Leave
PUT /api/leaves/admin/:id/approve

Requires administrator authentication.

Reject Leave
PUT /api/leaves/admin/:id/reject

Requires administrator authentication.

Administrator Employee APIs
Get Dashboard Statistics
GET /api/admin/stats

Returns:

Total employees
Pending requests
Approved requests
Rejected requests
Add Employee
POST /api/admin/employees
View Employees
GET /api/admin/employees
Credit or Debit Leave Balance
PUT /api/admin/employees/:id/balance

Example request:

{
  "action": "credit",
  "amount": 2,
  "reason": "Additional leave granted"
}

For debit:

{
  "action": "debit",
  "amount": 1,
  "reason": "Leave balance correction"
}

All administrator APIs require administrator authentication.

Environment Variables

Create a .env file inside the backend directory.

PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

Do not commit the .env file to GitHub.

The .env file is excluded using .gitignore.

Installation
1. Clone the Repository
git clone YOUR_GITHUB_REPOSITORY_URL
cd Leave-Management-System
Backend Setup

Open a terminal:

cd backend

Install dependencies:

npm install

Create:

backend/.env

Add the required environment variables.

Start the development server:

npm run dev

The backend runs on:

http://localhost:5000
Create Administrator Account

After configuring the .env file, run:

npm run create-admin

This creates the administrator account using the administrator credentials configured in .env.

Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend normally runs on:

http://localhost:5173
Running the Complete Application

Two terminals are required during local development.

Terminal 1 — Backend
cd backend
npm run dev
Terminal 2 — Frontend
cd frontend
npm run dev

Then open the frontend URL provided by Vite.

Testing

API testing was performed using Postman.

The following workflows should be tested:

Employee
Login
Apply leave
View leave balance
View leave history
Past-date validation
Overlapping leave validation
Administrator
Login
View dashboard statistics
Add employee
View employees
Set initial leave balance
Credit leave balance
Debit leave balance
Approve leave
Reject leave
Leave Balance Rules
New employees can be assigned an initial leave balance by the administrator.
The default initial balance is 20 days when no custom value is provided.
Approved leave reduces the employee's balance.
Rejected leave does not reduce the employee's balance.
Employees cannot apply for leave when the requested dates overlap an existing pending or approved leave.
Employees cannot submit leave with a start date in the past.
An employee cannot be approved for more leave days than their available balance.
Administrators can manually credit or debit leave days with a reason.
Deployment

The application consists of two parts:

Frontend → React/Vite
Backend  → Node.js/Express
Database → MongoDB Atlas

The frontend and backend can be deployed as separate services.

Frontend Deployment

The React frontend can be deployed using a supported frontend hosting platform such as Vercel.

Build command:

npm run build

Output directory:

dist
Backend Deployment

The Express backend can be deployed using a Node.js-compatible hosting platform.

The production environment must contain:

PORT
MONGO_URI
JWT_SECRET
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PASSWORD
Database

MongoDB Atlas is used as the cloud database.

The deployed backend must be allowed to connect to the MongoDB Atlas cluster through the configured network access settings.

Production Update Process
1. Update source code
        ↓
2. Test locally
        ↓
3. Commit changes to Git
        ↓
4. Push changes to GitHub
        ↓
5. Hosting platform builds the application
        ↓
6. Verify the deployed application
Live Deployment

Frontend:

TO BE ADDED AFTER DEPLOYMENT

Backend:

TO BE ADDED AFTER DEPLOYMENT

GitHub Repository:

TO BE ADDED
Future Improvements

Possible future improvements include:

Holiday calendar management
Separate leave balances by leave type
Leave accrual policies
Carry-forward leave
Email notifications
Reports and exports
Advanced employee search and filtering

These features are outside the current assignment scope.

Author

Sayeel Shetty

Full Stack Developer


### Important

Don't replace the README with a fake deployment URL yet. I've deliberately left:

```text
TO BE ADDED AFTER DEPLOYMENT