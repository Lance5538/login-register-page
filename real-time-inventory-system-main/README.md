# Real-Time Inventory Management System

## 📌 Overview

This project evolved from a traditional CRUD-based inventory system into an event-driven inventory workflow platform designed to demonstrate backend architecture, asynchronous processing, reliability engineering, and workflow orchestration.

The system supports approval-based inbound and outbound inventory operations. Business actions generate domain events which are processed asynchronously through BullMQ and Redis, enabling scalable workflow execution, retry mechanisms, event replay, notification generation, and operational monitoring.

The project is intentionally designed as an Event-Driven Modular Monolith to showcase production-oriented backend engineering practices without introducing unnecessary microservice complexity.


---

## 🚀 Features

### Authentication & Authorization

* JWT Authentication
* Role-Based Access Control (ADMIN / STAFF)

### Inventory Management

* Product Management
* Warehouse Management
* Real-Time Inventory Tracking
* Stock In
* Stock Out
* Transfer Between Warehouses

### Workflow Engine

* Inbound Orders
* Outbound Orders
* Approval Workflow
* Order Status Tracking

### Event-Driven Processing

* Domain Events
* BullMQ Queue Processing
* Redis-backed Job Queue
* Asynchronous Inventory Posting
* Event Replay API
* Retry & Failure Recovery
* Dead Event Handling
* Idempotent Processing

### Notification System

* Event-Based Notification Generation
* Notification Query API
* Event Filtering

### Monitoring & Operations

* Event Monitoring API
* Event Status Tracking
* Failure Investigation
* Operational Visibility

### Documentation

* OpenAPI / Swagger UI

---
## 🏗️ System Architecture

This project follows an **Event-Driven Modular Monolith** architecture.

Instead of directly updating inventory after an approval action, the system generates domain events which are processed asynchronously through BullMQ and Redis workers.

### Event Processing Flow

```text
Inbound / Outbound Approval
            │
            ▼
      Domain Event
            │
            ▼
       PostgreSQL
            │
            ▼
       BullMQ Queue
            │
            ▼
           Redis
            │
            ▼
      BullMQ Worker
            │
            ├────────────► Inventory Handler
            │                     │
            │                     ▼
            │              Inventory Posting
            │
            └────────────► Notification Consumer
                                  │
                                  ▼
                            Notification
```

### Reliability Features

The system includes several production-inspired reliability mechanisms:

* Retry Processing
* Dead Event Handling
* Manual Event Recovery
* Event Replay API
* Idempotent Inventory Posting
* Event Monitoring APIs
* Queue-Based Asynchronous Processing

### Event Lifecycle

```text
PENDING
   │
   ▼
PROCESSING
   │
   ├────────► PROCESSED
   │
   └────────► FAILED
                   │
                   ▼
                Retry
                   │
                   ▼
                 DEAD
                   │
                   ▼
          Manual Recovery

Replay API

PROCESSED
    │
    ▼
Replay
    │
    ▼
Reprocess Safely
```

### Event Module

The event module is responsible for:

* Domain Event Creation
* BullMQ Queue Integration
* Redis-backed Workers
* Retry & Recovery Logic
* Event Replay
* Notification Generation
* Operational Monitoring

Key files:

```text
src/event/
├── handlers/
│   ├── inbound-approved.handler.ts
│   ├── outbound-approved.handler.ts
│   └── notification.handler.ts
│
├── domain-event.queue.ts
├── domain-event.processor.ts
├── domain-event.service.ts
├── domain-event.bull-worker.ts
├── notification.service.ts
└── ...
```


---

## 🧱 Tech Stack

### Backend

- Node.js
- Express.js
- TypeScript

### Data Layer

- PostgreSQL
- Prisma ORM

### Event Processing

- Redis
- BullMQ

### Infrastructure

- Docker
- nginx

### API Documentation

- OpenAPI
- Swagger UI

---

## 📂 Project Structure

```
## 📂 Project Structure

```text
real-time-inventory-system/
│
├── backend/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   │
│   │   ├── event/
│   │   │   ├── handlers/
│   │   │   │   ├── inbound-approved.handler.ts
│   │   │   │   ├── outbound-approved.handler.ts
│   │   │   │   └── notification.handler.ts
│   │   │   │
│   │   │   ├── domain-event.queue.ts
│   │   │   ├── domain-event.processor.ts
│   │   │   ├── domain-event.service.ts
│   │   │   ├── domain-event.controller.ts
│   │   │   ├── domain-event.routes.ts
│   │   │   ├── domain-event.bull-worker.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── notification.routes.ts
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── inventory/
│   │   │   ├── products/
│   │   │   ├── warehouses/
│   │   │   ├── inbounds/
│   │   │   ├── outbounds/
│   │   │   ├── approvals/
│   │   │   ├── ocr/
│   │   │   └── users/
│   │   │
│   │   ├── middlewares/
│   │   ├── shared/
│   │   ├── lib/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── openapi.yaml
│   ├── package.json
│   └── tsconfig.json
│
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
