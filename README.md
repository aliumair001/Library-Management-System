Library Management System
A full-stack digital library management platform that enables librarians and users to manage book inventories, track lending activities, and handle user accounts with secure authentication.
Features:

🔐 JWT-based authentication with OTP verification
📚 Complete book catalog management (CRUD operations)
👥 User management system with role-based access
📖 Book lending and return tracking
🔄 Real-time availability status
📊 Dashboard for monitoring library activities
🔑 Password recovery and reset functionality
🎨 Modern, responsive UI with Tailwind CSS

Tech Stack:
Backend:

FastAPI (Python) - High-performance REST API
MongoDB with Motor (async driver)
JWT authentication with python-jose
Pydantic for data validation
Bcrypt password hashing

Frontend:

React 18 with Vite
React Router for navigation
Zustand for state management
Axios for API communication
Tailwind CSS for styling
React Toastify for notifications

Key Functionalities:

User registration and login with OTP verification
Browse and search book catalog
Borrow and return books
Track lending history
Manage user profiles
Admin dashboard for book and user management

Database Schema:

Users collection (authentication, profiles, roles)
Books collection (title, author, genre, copies)
Lending records (borrower, book, dates, status)
