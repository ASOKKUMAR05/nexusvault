# NexusVault - Personal Cloud Storage with AI Optimization

<div align="center">

![NexusVault Logo](https://img.shields.io/badge/NexusVault-Cloud%20Storage-5856D6?style=for-the-badge&logo=icloud&logoColor=white)

**Your Intelligent Cloud, Your Rules**

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)

</div>

## 🚀 Overview

NexusVault is an intelligent personal cloud storage platform that goes beyond traditional file storage. Built with cutting-edge AI integration, it offers automatic file categorization, smart search capabilities, duplicate detection, and comprehensive version control—all while maintaining complete data ownership.

### ✨ Key Features

- **🤖 AI-Powered Organization**: Automatic file categorization and smart tagging
- **🔍 Intelligent Search**: Natural language search with AI-enhanced results
- **🔄 Duplicate Detection**: Content-based duplicate identification to save storage
- **📊 Version Control**: Track file changes with complete version history
- **👥 Advanced Sharing**: Custom permissions (view, edit admin) with expiration dates
- **📈 Storage Analytics**: Visual insights into storage usage and file distribution
- **🎨 Modern UI**: Beautiful glassmorphism design with dark mode support
- **⚡ Real-time Updates**: Live upload progress and instant file operations

## 🛠️ Tech Stack

### Frontend
- **React** - Modern UI library
- **Vite** - Next-generation frontend tooling
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for metadata
- **Mongoose** - MongoDB object modeling
- **JWT** - Secure authentication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

### AI & Storage
- **File System** - Local/VPS storage
- **Content Hashing** - SHA-256 for duplicate detection
- **Rule-based AI** - Smart categorization (extensible to ML models)

## 📦 Installation

### Prerequisites

```bash
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
```

### Backend Setup

```bash
# Navigate to project root
cd project3

# Install backend dependencies (already done if you followed build process)
npm install

# Create .env file (already created)
# Edit backend/.env if needed for your MongoDB connection

# Start MongoDB (make sure MongoDB is running)
mongod

# Start backend server
npm run server:dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Run Both Simultaneously

```bash
# From project root
npm run dev
```

## 🎯 Usage

### 1. Register/Login
- Open `http://localhost:5173` in your browser
- Create a new account or login
- Default storage quota: 5GB

### 2. Upload Files
- Click "Upload File" button
- Drag and drop files or browse
- AI automatically categorizes and tags files

### 3. Search & Organize
- Use the search bar for natural language queries
- Filter by category (Documents, Images, Videos, etc.)
- View AI-generated tags and categories

### 4. Manage Files
- Download files with one click
- Delete unwanted files
- View storage analytics

### 5. Find Duplicates
- Automatic duplicate detection
- See potential space savings
- Remove duplicates easily

## 📂 Project Structure

```
project3/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, upload middleware
│   │   ├── models/          # Database schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── ai/          # AI services
│   │   │   ├── storage/     # File system ops
│   │   │   └── versioning/  # Version control
│   │   └── utils/           # Helper functions
│   └── .env                 # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── styles/          # CSS files
│   └── index.html
│
├── uploads/                 # File storage (gitignored)
└── docs/                    # Documentation
```

## 🔐 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login user
GET    /api/auth/profile     # Get user profile
PUT    /api/auth/profile     # Update profile
```

### Files
```
POST   /api/files/upload     # Upload file
GET    /api/files            # Get all files
GET    /api/files/:id        # Get file by ID
GET    /api/files/:id/download  # Download file
DELETE /api/files/:id        # Delete file
GET    /api/files/search     # Search files
GET    /api/files/duplicates # Get duplicates
GET    /api/files/stats      # Get storage stats
```

### Sharing
```
POST   /api/sharing/share    # Share file
GET    /api/sharing/shared-by-me    # Files shared by user
GET    /api/sharing/shared-with-me  # Files shared with user
PUT    /api/sharing/:id      # Update permissions
DELETE /api/sharing/:id      # Revoke share
```

### Versions
```
GET    /api/versions/:fileId           # Get version history
POST   /api/versions/:fileId/restore/:versionNumber  # Restore version
GET    /api/versions/:fileId/compare/:v1/:v2         # Compare versions
```

## 🌐 Deployment

### Local Development
Already set up! Just run `npm run dev`

### VPS Deployment (Production)

See `docs/DEPLOYMENT.md` for detailed VPS deployment instructions including:
- Server setup
- MongoDB installation
- NGINX configuration
- SSL certificates
- PM2 process management
- Local AI model setup

## 🎨 Features Showcase

### AI-Powered Categorization
Files are automatically sorted into categories:
- 📄 Documents (PDF, DOC, TXT)
- 🖼️ Images (JPG, PNG, GIF)
- 🎥 Videos (MP4, AVI, MOV)
- 🎵 Audio (MP3, WAV)
- 📦 Archives (ZIP, RAR)
- 💻 Code (JS, PY, HTML, CSS)

### Smart Search
- Search by filename, tags, or content
- AI-powered suggestions
- Advanced filters (date, size, category)
- Natural language queries

### Storage Management
- Visual storage analytics
- Category breakdown
- Usage trends
- Quota management

## 🤝 Contributing

This is a portfolio project, but suggestions and feedback are welcome!

## 📄 License

MIT License - Feel free to use this project for learning and portfolio purposes.

## 👨‍💻 Author

Created as a resume/portfolio project demonstrating:
- Full-stack development
- AI/ML integration
- Cloud architecture
- Modern UI/UX design
- Database management
- File system operations

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Fonts by [Google Fonts](https://fonts.google.com/)
- Inspired by modern cloud storage solutions

---

<div align="center">

**NexusVault** - Your Intelligent Cloud, Your Rules

Made with ❤️ and ☕

</div>
