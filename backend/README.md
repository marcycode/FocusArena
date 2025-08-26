# FocusArena Backend

A robust, scalable backend API for the FocusArena gamified productivity platform. Built with Node.js, Express, TypeScript, Prisma, and Socket.io.

## 🚀 Features

- **Authentication System**: Google OAuth integration with JWT tokens
- **Real-time Communication**: WebSocket support via Socket.io
- **Database Management**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and real-time data
- **API Validation**: Zod schema validation
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Comprehensive error management
- **TypeScript**: Full type safety throughout the codebase

## 🏗️ Architecture

```
src/
├── index.ts              # Main server entry point
├── middleware/           # Express middleware
│   ├── auth.ts          # JWT authentication
│   └── errorHandler.ts  # Global error handling
├── routes/              # API route handlers
│   ├── auth.ts          # Authentication routes
│   ├── users.ts         # User management
│   ├── sessions.ts      # Study session management
│   ├── campuses.ts      # University/campus management
│   ├── leaderboards.ts  # Leaderboard system
│   ├── friends.ts       # Friend management
│   └── achievements.ts  # Achievement system
├── services/            # Business logic services
│   ├── prismaService.ts # Database management
│   ├── redisService.ts  # Caching service
│   └── socketService.ts # WebSocket management
└── prisma/              # Database schema and migrations
    └── schema.prisma    # Database schema definition
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL-based)
- **ORM**: Prisma
- **Caching**: Redis (optional with Supabase real-time)
- **Real-time**: Socket.io + Supabase real-time subscriptions
- **Authentication**: Passport.js + Google OAuth (can integrate with Supabase Auth)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account (free tier available)
- Redis 6+ (optional with Supabase real-time)
- Google OAuth credentials (optional with Supabase Auth)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

**For Supabase setup, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.**

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# JWT
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret

# Google OAuth (optional with Supabase)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Redis (optional with Supabase real-time)
REDIS_URL=redis://localhost:6379

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/history` - Get study history
- `GET /api/users/achievements` - Get user achievements

### Study Sessions
- `POST /api/sessions/start` - Start study session
- `PUT /api/sessions/complete` - Complete study session
- `GET /api/sessions/history` - Get session history
- `GET /api/sessions/analytics` - Get session analytics
- `GET /api/sessions/active` - Get active session

### Campuses & Universities
- `GET /api/campuses/universities` - List universities
- `POST /api/campuses/universities` - Create university
- `GET /api/campuses/campuses` - List campuses
- `POST /api/campuses/campuses` - Create campus
- `GET /api/campuses/:id/activity` - Get campus activity
- `GET /api/campuses/:id/leaderboard` - Get campus leaderboard

### Leaderboards
- `GET /api/leaderboards/global` - Global leaderboard
- `GET /api/leaderboards/university/:id` - University leaderboard
- `GET /api/leaderboards/friends` - Friends leaderboard
- `GET /api/leaderboards/subject/:subject` - Subject leaderboard

### Friends
- `GET /api/friends` - Get user's friends
- `POST /api/friends/add` - Add friend
- `PUT /api/friends/:id/accept` - Accept friend request
- `PUT /api/friends/:id/reject` - Reject friend request
- `DELETE /api/friends/:id` - Remove friend

### Achievements
- `GET /api/achievements` - List all achievements
- `GET /api/achievements/:id` - Get achievement details
- `GET /api/achievements/user/:id` - Get user achievements
- `POST /api/achievements/check/:id` - Check and unlock achievements

## 🔌 WebSocket Events

### Client → Server
- `session:start` - Start study session
- `session:complete` - Complete study session
- `friend:request` - Send friend request
- `achievement:unlocked` - Achievement unlocked
- `level:up` - Level up event
- `user:status` - Update user status

### Server → Client
- `session:started` - Session started notification
- `session:completed` - Session completed notification
- `campus:activity` - Campus activity updates
- `friend:request_received` - Friend request received
- `achievement:unlocked` - Achievement unlocked notification
- `level:up` - Level up notification

## 🗄️ Database Schema

The database includes the following main entities:

- **Users**: User profiles, XP, levels, preferences
- **Universities**: University information and metadata
- **Campuses**: Campus locations and details
- **StudySessions**: Study session tracking and analytics
- **Friendships**: Friend relationships and status
- **Achievements**: Achievement definitions and conditions
- **UserAchievements**: User achievement unlocks

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Environment Configuration

Set production environment variables:
- `NODE_ENV=production`
- Production database URL
- Production Redis URL
- Secure JWT secrets
- Production Google OAuth credentials

### 3. Process Management

Use PM2 or similar process manager:

```bash
npm install -g pm2
pm2 start dist/index.js --name focusarena-backend
pm2 startup
pm2 save
```

### 4. Reverse Proxy

Configure Nginx or Apache as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
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

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against API abuse
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Helmet.js security headers

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Error Handling**: Comprehensive error logging
- **Health Checks**: `/health` endpoint for monitoring
- **Socket.io Events**: Real-time connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔄 Updates & Maintenance

- **Dependencies**: Regular updates via `npm audit` and `npm update`
- **Database**: Regular backups and schema migrations
- **Security**: Monitor security advisories and update accordingly
- **Performance**: Monitor API response times and optimize queries
