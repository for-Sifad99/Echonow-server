# 📰 EchoNow - Backend Server

Welcome to the **EchoNow Backend** — the server-side of a powerful full-stack news platform designed to revolutionize how users consume news. EchoNow delivers trending articles, subscription-based premium content, and a seamless user experience through RESTful APIs.

---

## 🔐 Admin Credentials

- **Email:** sifayed99@gmail.com
- **Password:** @Admin1234  
 

> These credentials are for demonstration and testing purposes only.

---

## 🔗 Project Links

- 🌐 **Frontend Live Site:** [https://echonow-client.web.app](https://echonow-client.web.app)
- 🌐 **Backend Live Site:** [https://echonow-server.vercel.app/](https://echonow-server.vercel.app/)
- 💻 **Client GitHub Repository:** [https://github.com/Programming-Hero-Web-Course4/b11a12-client-side-for-Sifad99.git](https://github.com/Programming-Hero-Web-Course4/b11a12-client-side-for-Sifad99.git)
- ⚙️ **Server GitHub Repository:** [https://github.com/Programming-Hero-Web-Course4/b11a12-server-side-for-Sifad99.git](https://github.com/Programming-Hero-Web-Course4/b11a12-server-side-for-Sifad99.git)

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

1. **User Authentication & Authorization** using JWT and Firebase.
2. **Role-Based Access Control** – supports Normal Users, Premium Users, and Admins.
3. **JWT Protected Routes** to secure article posting, profile, subscription, and admin access.
4. **Dynamic Article Filtering** via publisher, tag, and search query.
5. **Article Approval Workflow** – only admin-approved articles become public.
6. **Premium Article Restriction** – only subscribed users can view premium content.
7. **Post Limiting for Normal Users** – only one article allowed unless subscribed.
8. **Auto Subscription Expiry** based on selected time (1 min, 5 days, 10 days).
9. **View Count Tracking** for trending article calculation.
10. **Admin Panel API** with publisher management, pie charts, user stats, and moderation tools.
11. **Pagination Support** for All Users and All Articles (admin dashboard).
12. **CRUD Operations with Toast Notification Support** (handled on client side).

---

🔄 API Endpoints Overview
Only highlights — for full API details refer to the codebase

### Auth Routes
POST /register
POST /login
POST /jwt
GET /user/:email – get user role/status

### Articles
POST /articles – Add new article (with subscription limit check)
GET /articles – Get all approved articles with filters & pagination
GET /articles/premium – Premium-only articles
GET /articles/:id – Get article details
PUT /articles/views/:id – Increment view count
PUT /articles/:id – Update article
DELETE /articles/:id

### Admin
GET /admin/users – All users
PATCH /admin/make-admin/:id
GET /admin/articles – All articles
PATCH /admin/approve/:id
PATCH /admin/decline/:id
PATCH /admin/make-premium/:id
DELETE /admin/article/:id

### Publishers
POST /publishers – Add new publisher
GET /publishers – All publishers

## 🔍 Additional Notes
All GET requests are fetched using TanStack Query on the client.
All private routes use firebase token verification.
Uses react-google-charts (on client) to show visual analytics.
All image uploads are handled using Cloudinary/ImgBB.
Proper loaders and SweetAlerts/Toasts are integrated for all async operations.
Fully supports responsive design, including dashboard.

---

## 🛠️ Installation Guide

Follow these steps to set up and run the EchoNow backend server locally:

### 📦 Prerequisites

- Node.js (v14 or later)
- MongoDB Atlas account (or local MongoDB setup)
- ImgBB or Cloudinary account (for image uploads)

---

1. Clone the repository
git clone https://github.com/Programming-Hero-Web-Course4/b11a12-server-side-for-Sifad99.git
cd echonow-server

2. Install dependencies
npm install 

3. Start the server
npm run dev

