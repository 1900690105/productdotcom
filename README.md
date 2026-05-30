# Video 18 – Serverless Email Testing + Admin Dashboard CRUD

A fullstack React application built using **ReactJS**, **Tailwind CSS**, and **Supabase** with:

- Authentication (Login / Signup)
- Role-Based Access (Admin / User)
- Admin Dashboard
- Product CRUD Operations
- Image Upload using Supabase Storage
- Protected Routes
- Welcome Email System using EmailJS
- Production-style Full Testing

---

# 🚀 Features

## Authentication

- User Signup
- User Login
- Secure Authentication using Supabase Auth
- Logout Functionality

## Role-Based Access Control

### Admin

- Access Admin Dashboard
- Add Product
- Edit Product
- Delete Product
- Upload Product Images
- Manage Products

### User

- View Products Only
- Restricted from Admin Routes

---

## Product Management (CRUD)

### Create Product

Admin can:

- Add Product Name
- Add Price
- Add Description
- Upload Product Image

### Read Product

- Admin can view all products
- User can view all products

### Update Product

Admin can:

- Edit product details
- Update product image

### Delete Product

Admin can:

- Delete products securely

---

## Image Upload System

Using **Supabase Storage**

Features:

- Upload Product Images
- Store Images in Cloud Storage
- Generate Public URL
- Display Uploaded Images Dynamically

Bucket Used:

```txt
product-images
```
