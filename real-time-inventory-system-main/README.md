# Real-Time Inventory Management System

## 📌 Overview
This is a full-stack inventory management system designed to demonstrate backend engineering skills, including API design, authentication, database modeling, and system structure.

The system supports product and warehouse management, as well as real-time inventory operations such as stock-in, stock-out, and transfers.

---

## 🚀 Features

- JWT Authentication
- Role-based Access Control (ADMIN / STAFF)
- Product Management (CRUD)
- Warehouse Management (CRUD)
- Inventory Operations
  - Stock In
  - Stock Out
  - Transfer Between Warehouses
- Transaction History Tracking
- Swagger API Documentation

---

## 🧱 Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- PostgreSQL
- Prisma ORM

### API Documentation
- OpenAPI (Swagger UI)

---

## 📂 Project Structure

```
real-time-inventory-system/
├── backend/
│   ├── modules/
│   ├── middlewares/
│   ├── prisma/
│   ├── openapi.yaml
│   └── ...
├── frontend/ (optional)
├── docs/
├── .gitignore
└── README.md
```

---

## ⚙️ Backend Setup

### 1️⃣ Install dependencies

```bash
cd backend
npm install
```

### 2️⃣ Configure environment variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_db"
JWT_SECRET="your_jwt_secret"
PORT=4000
```

### 3️⃣ Run database migrations
```
npx prisma migrate dev
```

### 4️⃣ Start the server
```
npm run dev
```

---

## 📖 API Documentation

Swagger UI is available at:

http://localhost:4000/api-docs

You can:
- View all endpoints
- Test APIs directly
- Authorize with JWT

---

## 🔑 Authentication

### Login
```
POST /auth/login
```

Returns a JWT token.

### Use Token
In Swagger UI:
- Click Authorize
- Enter:

Bearer YOUR_TOKEN

---

## 🧪 Example API Flow

1. Register a user
2. Login to get token
3. Authorize in Swagger
4. Create product (ADMIN only)
5. Create warehouse (ADMIN only)
6. Perform stock operations

---

## 📌 Roles

Role   | Permissions
-------|------------
ADMIN  | Full access
STAFF  | Read + limited operations

---

## 📦 Future Improvements

- Docker support
- CI/CD pipeline
- Frontend integration
- Load balancing & scalability
- Caching (Redis)

---

## 👨‍💻 Author

GitHub: https://github.com/May-rain1989

---

## ⭐ Notes

This project is built as a portfolio-level backend system to demonstrate:
- Clean architecture
- RESTful API design
- Authentication & authorization
- Database consistency and transaction handling
