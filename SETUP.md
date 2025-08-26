# FocusArena - Complete Setup Guide

This guide will walk you through setting up the complete FocusArena platform, including both the backend API and frontend React application.

## 🎯 Project Overview

FocusArena is a gamified productivity platform for university students that combines:
- **Pomodoro Study Sessions** with gamification
- **Campus Communities** with real-time activity
- **Social Features** including friends and leaderboards
- **Achievement System** with XP and levels
- **Real-time Updates** via WebSockets

## 🏗️ Architecture

```
FocusArena/
├── project/                 # Frontend React App
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API and Socket services
│   │   └── ...
│   └── package.json
├── backend/                 # Backend API Server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── ...
│   └── package.json
└── README.md
```

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 12+** - [Download here](https://www.postgresql.org/download/)
- **Redis 6+** - [Download here](https://redis.io/download)
- **Git** - [Download here](https://git-scm.com/)

### Windows Users
- Install PostgreSQL from the official website
- Install Redis using WSL2 or Docker
- Use Git Bash or PowerShell for terminal commands

### macOS Users
```bash
# Install Homebrew if you haven't
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql redis
```

### Linux Users
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm postgresql postgresql-contrib redis-server

# CentOS/RHEL
sudo yum install nodejs npm postgresql postgresql-server redis
```

## 🚀 Complete Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd FocusArena
```

### Step 2: Backend Setup

#### 2.1 Install Dependencies
```bash
cd backend
npm install
```

#### 2.2 Database Setup

**Start PostgreSQL:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services
```

**Create Database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE focusarena;
CREATE USER focusarena_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE focusarena TO focusarena_user;
\q
```

**Start Redis:**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows
# Start Redis service or use Docker
```

#### 2.3 Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
```

**Required Environment Variables:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://focusarena_user:your_password@localhost:5432/focusarena"

# JWT (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:5173
```

#### 2.4 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
6. Copy Client ID and Client Secret to your `.env` file

#### 2.5 Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Verify connection
npm run db:studio
```

#### 2.6 Start Backend Server

```bash
# Development mode
npm run dev

# Or production build
npm run build
npm start
```

**Verify Backend:**
- Health check: `http://localhost:5000/health`
- API docs: Check console for available endpoints

### Step 3: Frontend Setup

#### 3.1 Install Dependencies
```bash
cd ../project
npm install

# Install additional dependencies for backend integration
npm install socket.io-client
```

#### 3.2 Environment Configuration

Create `.env` file in the `project` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### 3.3 Start Frontend Development Server

```bash
npm run dev
```

**Verify Frontend:**
- App should open at `http://localhost:5173`
- Check browser console for any errors

### Step 4: Integration Testing

#### 4.1 Test Authentication Flow

1. Open the app in your browser
2. Click login (should redirect to Google OAuth)
3. Complete Google login
4. Verify you're redirected back with tokens
5. Check localStorage for `accessToken` and `refreshToken`

#### 4.2 Test Real-time Features

1. Open multiple browser tabs
2. Start a study session in one tab
3. Verify real-time updates in other tabs
4. Check browser console for WebSocket events

#### 4.3 Test API Endpoints

Use the browser console or Postman to test:
```javascript
// Test API health
fetch('http://localhost:5000/health')
  .then(res => res.json())
  .then(console.log)

// Test authenticated endpoint
fetch('http://localhost:5000/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(res => res.json())
.then(console.log)
```

## 🔧 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check if ports are in use
netstat -an | grep :5000
lsof -i :5000

# Check environment variables
echo $DATABASE_URL
echo $REDIS_URL

# Check database connection
psql -U focusarena_user -d focusarena -h localhost
```

#### Database Connection Issues
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -c "\l"

# Reset database if needed
dropdb focusarena
createdb focusarena
```

#### Redis Connection Issues
```bash
# Verify Redis is running
redis-cli ping

# Check Redis logs
sudo journalctl -u redis
```

#### Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version
```

#### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check browser console for CORS errors
- Ensure frontend is running on the correct port

### Performance Issues

#### Database Performance
```bash
# Check slow queries
npm run db:studio

# Monitor database connections
psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

#### Memory Issues
```bash
# Check Node.js memory usage
ps aux | grep node

# Monitor Redis memory
redis-cli info memory
```

## 🚀 Production Deployment

### Backend Deployment

#### 1. Build for Production
```bash
cd backend
npm run build
```

#### 2. Environment Setup
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@prod-host:5432/focusarena"
REDIS_URL="redis://prod-host:6379"
FRONTEND_URL="https://yourdomain.com"
```

#### 3. Process Management
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name focusarena-backend

# Save PM2 configuration
pm2 startup
pm2 save
```

#### 4. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend Deployment

#### 1. Build for Production
```bash
cd project
npm run build
```

#### 2. Deploy to Hosting Service
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **AWS S3**: Upload `dist` folder
- **Traditional hosting**: Upload `dist` folder to web server

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# Database health
psql -U focusarena_user -d focusarena -c "SELECT 1;"

# Redis health
redis-cli ping
```

### Logs
```bash
# Backend logs
pm2 logs focusarena-backend

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Backup Strategy
```bash
# Database backup
pg_dump -U focusarena_user focusarena > backup_$(date +%Y%m%d).sql

# Redis backup
redis-cli BGSAVE
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Rotate secrets regularly

### Database Security
- Use strong passwords
- Limit database access to application only
- Regular security updates

### API Security
- Rate limiting is enabled by default
- CORS is configured for security
- Input validation with Zod schemas

## 📚 Additional Resources

### Documentation
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [Socket.io](https://socket.io/docs/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Redis](https://redis.io/documentation)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Server](your-discord-link)
- [Documentation Wiki](your-wiki-link)

## 🎉 Success!

Once you've completed all steps, you should have:
- ✅ Backend API running on port 5000
- ✅ Frontend app running on port 5173
- ✅ Database connected and migrated
- ✅ Redis caching working
- ✅ Google OAuth authentication
- ✅ Real-time WebSocket communication
- ✅ Full API functionality

Your FocusArena platform is now ready for development and testing!

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review error logs in the console
3. Verify all environment variables are set correctly
4. Ensure all services (PostgreSQL, Redis) are running
5. Create an issue in the repository with detailed error information

Happy coding! 🚀
