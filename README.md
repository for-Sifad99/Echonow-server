# 📰 EchoNow - Backend Server
Welcome to the **EchoNow Backend** — the server-side of a powerful full-stack news platform designed to revolutionize how users consume news. EchoNow delivers trending articles, subscription-based premium content, and a seamless user experience through RESTful APIs.

---
  
- **Live Site:** [Live Demo!](https://echonow-server.vercel.app/)  

---

## 🚀 Technologies Used

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **Firebase for Authentication**
- **dotenv for environment variables**
- **CORS Middleware**
- **ImgBB (image uploads)**
- **TanStack Query (used on client for GET operations)**

---

## ✅ Key Features (Server-Side)

- **User Authentication & Authorization** using JWT and Firebase.
- **Role-Based Access Control** – supports Normal Users, Premium Users, and Admins.
- **JWT Protected Routes** to secure article posting, profile, subscription, and admin access.
- **Dynamic Article Filtering** via publisher, tag, and search query.
- **Article Approval Workflow** – only admin-approved articles become public.
- **Premium Article Restriction** – only subscribed users can view premium content.
- **Post Limiting for Normal Users** – only one article allowed unless subscribed.
- **Auto Subscription Expiry** based on selected time (1 min, 5 days, 10 days).
- **View Count Tracking** for trending article calculation.
- **Admin Panel API** with publisher management, pie charts, user stats, and moderation tools.
- **Pagination Support** for All Users and All Articles (admin dashboard).

---

🔄 API Endpoints Overview
Only highlights — for full API details refer to the codebase

## 🔑 Auth & User APIs

| Method | Endpoint                   | Auth            | Role  | Description                                  |
|--------|---------------------------|-----------------|-------|----------------------------------------------|
| POST   | `/users`                   | ✅ Firebase Token | Any   | Create/update user profile & premium info    |
| GET    | `/users/:email`            | ❌              | Any   | Get user by email                            |
| GET    | `/all-users`               | ✅ Firebase Token | Admin | Get all users (with premium count)           |
| GET    | `/users-count-info`        | ❌              | Any   | Get counts of total, premium & normal users  |
| PATCH  | `/users/:email`            | ✅ Firebase Token | Any   | Update user fields                          |
| PATCH  | `/users/admin/:email`      | ✅ Firebase Token | Admin | Make a user admin                           |
| POST   | `/get-role`                | ❌              | Any   | Get role by email                           |

---

## 📝 Article APIs

| Method | Endpoint                             | Auth            | Role             | Description                                       |
|--------|--------------------------------------|-----------------|------------------|---------------------------------------------------|
| POST   | `/article`                           | ✅ Firebase Token | Any (limited)    | Create new article (normal users limited)         |
| GET    | `/articles`                          | ❌              | Any              | Get approved articles (search, filter, pagination)|
| GET    | `/articles/user?email=`              | ❌              | Any              | Get all articles by user email                   |
| GET    | `/articles/premium`                  | ✅ Firebase Token | Any (Premium)    | Get premium articles (pagination)                |
| GET    | `/all-articles`                      | ✅ Firebase Token | Admin            | Get all articles (sorted by status)              |
| GET    | `/article/:id`                       | ✅ Firebase Token | Any              | Get single article by ID                         |
| PATCH  | `/article/:id/views`                 | ✅ Firebase Token | Any              | Increment view count                             |
| GET    | `/articles/special`                  | ❌              | Any              | Get hot, trending, celebrity & fashion articles  |
| GET    | `/articles/top-fashion`              | ❌              | Any              | Get top 4 fashion articles                       |
| PATCH  | `/articles/:id`                      | ✅ Firebase Token | Admin            | Update article                                   |
| DELETE | `/articles/:id`                      | ✅ Firebase Token | Admin            | Delete article                                   |

---

## 📰 Publisher APIs

| Method | Endpoint                     | Auth            | Role  | Description                                         |
|--------|-----------------------------|-----------------|-------|-----------------------------------------------------|
| GET    | `/publishers-stats`          | ❌              | Any   | Get publisher names with approved article counts    |
| GET    | `/publisher`                 | ✅ Firebase Token | Admin | Get all publishers with count & recent             |
| POST   | `/publisher`                 | ✅ Firebase Token | Admin | Add new publisher                                   |
| GET    | `/publisher-with-articles`   | ❌              | Any   | Get all publishers with one matched article         |

---

## 💳 Payment API

| Method | Endpoint                  | Auth            | Role  | Description                                        |
|--------|--------------------------|-----------------|-------|----------------------------------------------------|
| POST   | `/create-payment-intent`  | ✅ Firebase Token | Any   | Create Stripe payment intent for subscription      |

---

## ⚙️ Environment Variables

You need to setup `.env`  .env file:

```env
# Server Port
PORT=YOUR_PORT

# Database Credentials
DB_USER=YOUR_DB_USER
DB_PASS=YOUR_DB_PASSWORD

# Payment Gateway (Stripe) Secret Key
PAYMENT_GETWAY_KEY=YOUR_STRIPE_SECRET_KEY

# Firebase Service Key (JSON or base64)
FB_SERVICE_KEY=YOUR_FIREBASE_SERVICE_KEY
```

---

## 🛠️ Installation Guide

Follow these steps to set up and run the EchoNow backend server locally:

### 📦 Prerequisites

- Node.js
- MongoDB Atlas account (or local MongoDB setup)
- ImgBB or Cloudinary account (for image uploads)

---

## 🛠 Installation & Setup

1. Clone the server repo
   - git clone https://github.com/for-Sifad99/Echonow-server.git

2. Navigate to the project directory
   - cd echonow-server

3. Install dependencies
   - npm install

4. Start the development server
   - npm run dev

---

## 🔮 Future Updates

This backend is just the beginning.  
In the future, the project will be refactored into a full MVC (Model–View–Controller) pattern, with all modules properly structured.  
More secure and fully functional APIs will be added to improve performance, reliability, and scalability.

Stay tuned for upcoming updates!