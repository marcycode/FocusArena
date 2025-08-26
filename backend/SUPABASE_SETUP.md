# Supabase Setup Guide for FocusArena

This guide will walk you through setting up Supabase as your database for FocusArena.

## What is Supabase?

Supabase is an open-source alternative to Firebase that provides:
- **PostgreSQL Database** (your existing Prisma schema works perfectly)
- **Real-time subscriptions** (can replace some Socket.io functionality)
- **Built-in authentication** (Google OAuth, JWT, etc.)
- **Auto-generated APIs** (REST and GraphQL)
- **Dashboard interface** (no command line needed)

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with your GitHub account
4. Click "New Project"

## Step 2: Create Your Project

1. **Organization**: Create a new one (or use existing)
2. **Project name**: `focusarena` (or your preferred name)
3. **Database password**: Create a strong password (save this!)
4. **Region**: Choose closest to you (US East/West for most users)
5. Click "Create new project"
6. Wait for setup to complete (2-3 minutes)

## Step 3: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **Anon (public) key**: `[YOUR-ANON-KEY]`
   - **Service (secret) key**: `[YOUR-SERVICE-ROLE-KEY]`

3. Go to **Settings** → **Database**
4. Copy the **Connection string (URI)**
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

## Step 4: Update Your Environment File

1. Create a `.env` file in your `backend` directory
2. Copy the contents from `env.example`
3. Replace the placeholder values:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:YourActualPassword@db.YourProjectRef.supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL=https://YourProjectRef.supabase.co
SUPABASE_ANON_KEY=YourAnonKey
SUPABASE_SERVICE_ROLE_KEY=YourServiceRoleKey

# JWT (generate these)
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret

# Other settings...
```

## Step 5: Generate JWT Secrets

Run these commands in your terminal to generate secure JWT keys:

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## Step 6: Set Up Database Schema

1. **Install Prisma CLI** (if not already installed):
   ```bash
   npm install -g prisma
   ```

2. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

3. **Push schema to Supabase**:
   ```bash
   npm run db:push
   ```

## Step 7: Test Your Connection

1. **Start your backend**:
   ```bash
   npm run dev
   ```

2. **Check health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```

   You should see:
   ```json
   {
     "status": "OK",
     "services": {
       "database": "connected",
       "redis": "connected",
       "supabase": "connected"
     }
   }
   ```

## Step 8: Set Up Google OAuth (Optional)

If you want to use Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized origins: `http://localhost:5000`
4. Add redirect URIs: `http://localhost:5000/auth/google/callback`
5. Update your `.env` file with the credentials

## Step 9: Redis Setup (Optional)

Since Supabase provides real-time features, Redis is optional:

1. **Option 1**: Install Redis locally
2. **Option 2**: Use Docker: `docker run -d -p 6379:6379 redis:alpine`
3. **Option 3**: Use cloud Redis service

## Benefits of Using Supabase

### ✅ **What You Get**
- **Always-on database** (24/7 availability)
- **Real-time subscriptions** (live updates)
- **Built-in authentication** (Google OAuth, JWT)
- **Automatic backups** (your data is safe)
- **Dashboard interface** (easy data management)
- **Scalability** (handles more users)
- **Free tier** (500MB database, 50MB storage)

### 🔄 **What Changes**
- **Database URL** points to Supabase instead of local
- **Real-time features** can use Supabase subscriptions
- **Authentication** can leverage Supabase Auth
- **Deployment** becomes much easier

### 📱 **What Stays the Same**
- **Your Prisma schema** (100% compatible)
- **Your API routes** (no changes needed)
- **Your frontend code** (minimal changes)
- **Your business logic** (identical)

## Troubleshooting

### Connection Issues
- Check your `.env` file has correct values
- Verify Supabase project is active
- Check database password is correct

### Schema Issues
- Run `npm run db:generate` after schema changes
- Use `npm run db:push` to update database
- Check Prisma Studio: `npm run db:studio`

### Real-time Issues
- Verify your Supabase keys are correct
- Check browser console for connection errors
- Ensure you're using the anon key for public operations

## Next Steps

1. **Test your backend** with the health endpoint
2. **Create some test data** through your API
3. **Deploy your app** (Vercel, Netlify, etc.)
4. **Share FocusArena** with others!

## Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
- **FocusArena Issues**: Check your project repository

---

**Congratulations!** You now have a production-ready database that can handle real users and scale with your app's growth.
