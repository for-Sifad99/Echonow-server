# 📰 EchoNow - Backend Server

Welcome to the **EchoNow Backend** — the server-side of a powerful full-stack news platform designed to revolutionize how users consume news. EchoNow delivers trending articles, subscription-based premium content, and a seamless user experience through RESTful APIs.

---

- **Live Site:** [Live Demo!](https://echonow-server.vercel.app/)  

---

## 🚀 Technologies Used

- **Node.js** (v18+)
- **Express.js** (v5.1.0)
- **MongoDB + MongoDB Driver** (v6.16.0)
- **Firebase Admin SDK** (v13.4.0)
- **Stripe Payment API** (v18.3.0)
- **dotenv** for environment variables
- **CORS Middleware**
- **Nodemailer** for email verification

---

## ✅ Key Features (Server-Side)

- **User Authentication & Authorization** using Firebase ID Tokens
- **Role-Based Access Control** – supports Normal Users, Premium Users, and Admins
- **JWT Protected Routes** to secure article posting, profile, subscription, and admin access
- **Dynamic Article Filtering** via publisher, tag, and search query with pagination
- **Article Approval Workflow** – only admin-approved articles become public
- **Premium Article Restriction** – only subscribed users can view premium content
- **Post Limiting for Normal Users** – only one article allowed unless subscribed
- **Auto Subscription Expiry** based on selected time (1 min, 5 days, 10 days)
- **View Count Tracking** for trending article calculation
- **Admin Panel API** with publisher management, pie charts, user stats, and moderation tools
- **Pagination Support** for All Users and All Articles (admin dashboard)
- **Email Verification System** with OTP via Nodemailer
- **Image Upload Integration** with ImgBB

---

## 🔄 API Endpoints Overview

### 🔑 Auth & User APIs

| Method | Endpoint                   | Auth            | Role  | Description                                  |
|--------|---------------------------|-----------------|-------|----------------------------------------------|
| POST   | `/api/users`               | ✅ Firebase Token | Any   | Create/update user profile & premium info    |
| GET    | `/api/users/:email`        | ❌              | Any   | Get user by email                            |
| GET    | `/api/all-users`           | ✅ Firebase Token | Admin | Get all users (with premium count)           |
| GET    | `/api/users-count-info`    | ❌              | Any   | Get counts of total, premium & normal users  |
| PATCH  | `/api/users/:email`        | ✅ Firebase Token | Any   | Update user fields                          |
| PATCH  | `/api/users/admin/:email`  | ✅ Firebase Token | Admin | Make a user admin                           |
| POST   | `/api/get-role`            | ❌              | Any   | Get role by email                           |

### 📝 Article APIs

| Method | Endpoint                             | Auth            | Role             | Description                                       |
|--------|--------------------------------------|-----------------|------------------|---------------------------------------------------|
| POST   | `/api/article`                       | ✅ Firebase Token | Any (limited)    | Create new article (normal users limited)         |
| GET    | `/api/articles`                      | ❌              | Any              | Get approved articles (search, filter, pagination)|
| GET    | `/api/articles/user`                 | ❌              | Any              | Get all articles by user email                   |
| GET    | `/api/articles/premium`              | ✅ Firebase Token | Any (Premium)    | Get premium articles (pagination)                |
| GET    | `/api/all-articles`                  | ✅ Firebase Token | Admin            | Get all articles (sorted by status)              |
| GET    | `/api/article/:id`                   | ✅ Firebase Token | Any              | Get single article by ID                         |
| PATCH  | `/api/article/:id/views`             | ❌              | Any              | Increment view count                             |
| GET    | `/api/articles/special`              | ❌              | Any              | Get hot, trending, celebrity & fashion articles  |
| GET    | `/api/articles/top-fashion`          | ❌              | Any              | Get top 4 fashion articles                       |
| GET    | `/api/articles/banner-trending`      | ❌              | Any              | Get trending articles for banner                 |
| PATCH  | `/api/articles/:id`                  | ✅ Firebase Token | Admin            | Update article                                   |
| DELETE | `/api/articles/:id`                  | ✅ Firebase Token | Admin            | Delete article                                   |

### 📰 Publisher APIs

| Method | Endpoint                     | Auth            | Role  | Description                                         |
|--------|-----------------------------|-----------------|-------|-----------------------------------------------------|
| GET    | `/api/publishers-stats`      | ❌              | Any   | Get publisher names with approved article counts    |
| GET    | `/api/publisher`             | ✅ Firebase Token | Admin | Get all publishers with count & recent             |
| POST   | `/api/publisher`             | ✅ Firebase Token | Admin | Add new publisher                                   |
| GET    | `/api/publisher-with-articles`| ❌              | Any   | Get all publishers with one matched article         |

### 💳 Payment API

| Method | Endpoint                  | Auth            | Role  | Description                                        |
|--------|--------------------------|-----------------|-------|----------------------------------------------------|
| POST   | `/api/create-payment-intent`| ✅ Firebase Token | Any   | Create Stripe payment intent for subscription      |

### 📧 Email Verification APIs

| Method | Endpoint                  | Auth            | Role  | Description                                        |
|--------|--------------------------|-----------------|-------|----------------------------------------------------|
| POST   | `/api/request-otp`        | ✅ Firebase Token | Any   | Request OTP for email verification                 |
| POST   | `/api/verify-otp`         | ✅ Firebase Token | Any   | Verify OTP and mark email as verified              |
| GET    | `/api/verification-status/:email`| ❌      | Any   | Check email verification status                    |

---

## ⚙️ Environment Variables

You need to setup `.env` file:

```env
# Server Port
PORT=5000

# Database Credentials
DB_USER=your_mongodb_user
DB_PASS=your_mongodb_password

# Payment Gateway (Stripe) Secret Key
PAYMENT_GETWAY_KEY=your_stripe_secret_key

# Firebase Service Key (base64 encoded)
FB_SERVICE_KEY=your_base64_encoded_firebase_service_key

# Email Configuration (for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ImgBB API Key (for image uploads)
IMG_BB_API_KEY=your_imgbb_api_key
```

---

## 🛠️ Installation Guide

Follow these steps to set up and run the EchoNow backend server locally:

### 📦 Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB setup)
- Firebase Admin SDK service account key
- Stripe account for payment processing
- ImgBB or similar service for image uploads
- Gmail account with app password for email verification

---

## 🛠 Installation & Setup

1. Clone the server repo
   ```bash
   git clone https://github.com/for-Sifad99/Echonow-server.git
   ```

2. Navigate to the project directory
   ```bash
   cd echonow-server
   ```

3. Install dependencies
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add your environment variables

5. Start the development server
   ```bash
   npm start
   ```

---

## 🏗️ Project Structure

```
echonow-server/
├── config/
│   ├── database.js         # MongoDB connection
│   ├── firebase.js         # Firebase Admin SDK setup
│   └── stripe.js           # Stripe payment configuration
├── controllers/
│   ├── articleController.js       # Article-related logic
│   ├── userController.js          # User-related logic
│   ├── publisherController.js     # Publisher-related logic
│   ├── paymentController.js       # Payment-related logic
│   └── emailVerificationController.js # Email verification logic
├── middleware/
│   ├── auth.js             # Firebase token verification
│   └── admin.js            # Admin role verification
├── routes/
│   ├── articleRoutes.js    # Article API endpoints
│   ├── userRoutes.js       # User API endpoints
│   ├── publisherRoutes.js  # Publisher API endpoints
│   ├── paymentRoutes.js    # Payment API endpoints
│   └── emailVerificationRoutes.js # Email verification endpoints
├── .env                    # Environment variables
├── index.js                # Main server file
└── package.json            # Project dependencies
```

---

## 🔐 Authentication Flow

1. Client authenticates with Firebase on the frontend
2. Firebase returns an ID token
3. Client includes this token in the `Authorization` header as `Bearer <token>`
4. Backend verifies the token using Firebase Admin SDK
5. If valid, the request proceeds; otherwise, a 401 error is returned

---

## 🛡️ Security Features

- **Firebase Token Verification** for all protected routes
- **Role-Based Access Control** to restrict admin-only operations
- **Input Validation** on all endpoints
- **Rate Limiting** for OTP requests (1 per minute)
- **Secure Password Storage** (handled by Firebase)
- **Environment Variables** for sensitive data
- **CORS Configuration** to restrict allowed origins

---

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  photo: String,
  role: String, // "user" or "admin"
  isPremium: Boolean,
  premiumTaken: Date,
  premiumExpiresAt: Date,
  isEmailVerified: Boolean,
  emailVerifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Articles Collection
```javascript
{
  _id: ObjectId,
  title: String,
  image: String,
  publisher: String,
  tags: [String],
  description: String,
  authorName: String,
  authorEmail: String,
  authorPhoto: String,
  status: String, // "pending", "approved", "declined"
  isPremium: Boolean,
  viewCount: Number,
  postedDate: Date,
  declineReason: String
}
```

### Publishers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  logo: String,
  postedDate: Date
}
```

---

## 🔄 Future Updates

This backend is just the beginning.  
In the future, the project will be refactored into a full MVC (Model–View–Controller) pattern, with all modules properly structured.  
More secure and fully functional APIs will be added to improve performance, reliability, and scalability.

Stay tuned for upcoming updates!