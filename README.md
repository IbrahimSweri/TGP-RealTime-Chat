# Real-Time Chat Application 

---

## ⚠️ IMPORTANT DISCLAIMER

> **This is NOT real work ++++ this is Not a real work  and is FAR FROM MY FULL POTENTIAL.**
> 
> This project was built quickly as a learning exercise and does not represent my professional capabilities or best work.

**🌐 Live Demo**: [https://swerichatapp.netlify.app/login](https://swerichatapp.netlify.app/login)

---

A modern, real-time chat application built with React and Supabase, featuring group chats, direct messaging, presence tracking, and real-time synchronization.

> **Note**: This application uses **optimistic UI updates** for sending, editing, and deleting messages, providing instant user feedback with automatic rollback on failure. The app was built in a few days with the help of AI on TGP.

## Features

- 🔐 **User Authentication** - Secure login and signup with Supabase Auth
- 💬 **Group Chat** - Public group conversations
- 📨 **Direct Messaging** - Private one-on-one conversations
- 👥 **Presence Tracking** - See who's online in real-time
- ✏️ **Message Management** - Edit and delete your messages
- 🖼️ **Avatar Support** - Upload and manage profile pictures
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⚡ **Real-Time Updates** - Instant message synchronization using Supabase Realtime

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **UI Components**: @chatscope/chat-ui-kit-react
- **Deployment**: Netlify

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project ([Sign up here](https://supabase.com))

## Understanding RLS (Row Level Security)

**What is RLS?** Row Level Security is Supabase's security feature that controls who can read, insert, update, or delete data in your database tables. Think of it as "permissions" for your database.

**Why is it important?** Without RLS policies, your data could be accessible to anyone, or no one could access it. The SQL migration files in this project automatically set up the correct RLS policies.

**What you need to do:** Simply run the SQL files in order (see Step 6 below). The files will:
- Enable RLS on tables
- Create policies that allow authenticated users to read/write their own data
- Set up public read access where needed
- Secure direct messages so only participants can see them

**Don't worry** - if you're new to Supabase, just follow the steps below. The SQL files handle everything automatically!

## Setup Instructions

> **⚠️ Important for First-Time Supabase Users**: This guide assumes you're new to Supabase. Follow each step carefully and verify before moving to the next step.

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd realtime-chat
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Supabase Project

1. Go to [Supabase](https://app.supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name (e.g., "realtime-chat")
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (takes 1-2 minutes)

### Step 4: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Find **Project URL** and copy it
3. Find **anon public** key (under "Project API keys") and copy it
4. Keep these values - you'll need them in the next step

### Step 5: Configure Environment Variables

1. In your project root, create a file named `.env`:

```bash
# Windows (PowerShell)
New-Item .env

# Mac/Linux
touch .env
```

2. Open `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace** `your-project-id` and `your-anon-key-here` with the values from Step 4.

### Step 6: Set Up Database Schema (IMPORTANT!)

> **What is RLS?** Row Level Security (RLS) is Supabase's way of controlling who can read/write data. The SQL files below set up RLS policies automatically. **You must run them in order!**

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. **Execute each SQL file in this exact order** (copy-paste the entire file content):

#### 6.1. Base Schema
- Open `sql/supabase_schema.sql` from this project
- Copy **all** its content
- Paste into SQL Editor
- Click **"Run"** (or press Ctrl+Enter)
- ✅ Wait for "Success" message

#### 6.2. Direct Chat Features
- Open `sql/add_direct_chat_features.sql`
- Copy all content → Paste → Run
- ✅ Verify success

#### 6.3. Link Messages to Profiles
- Open `sql/link_messages_to_profiles.sql`
- Copy all content → Paste → Run
- ✅ Verify success

#### 6.4. Avatar Support
- Open `sql/add_avatar_to_messages.sql`
- Copy all content → Paste → Run
- ✅ Verify success

#### 6.5. Storage Setup
- Open `sql/setup_storage.sql`
- Copy all content → Paste → Run
- ✅ Verify success

#### 6.6. Fix Profiles RLS
- Open `sql/fix_profiles_rls.sql`
- Copy all content → Paste → Run
- ✅ Verify success

#### 6.7. Fix Rooms RLS
- Open `sql/fix_rooms_rls.sql`
- Copy all content → Paste → Run
- ✅ Verify success

#### 6.8. Enable Delete Events
- Open `sql/enable_delete_events.sql`
- Copy all content → Paste → Run
- ✅ Verify success

> **💡 Tip**: If you see "policy already exists" errors, that's okay - it means the policy was already created. Continue to the next file.

### Step 7: Verify RLS is Enabled

After running all SQL files, verify RLS is working:

1. In Supabase dashboard, go to **Authentication** → **Policies**
2. You should see policies for:
   - `profiles` table
   - `rooms` table
   - `messages` table
   - `room_participants` table

3. **Verify Realtime is enabled**:
   - Go to **Database** → **Replication**
   - Check that `messages` table is listed under "Tables in publication"

4. **Verify Storage**:
   - Go to **Storage**
   - You should see an `avatars` bucket

### Step 8: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 9: Test the Application

1. Open `http://localhost:5173` in your browser
2. **Sign up** with a new account
3. Try sending a message
4. Open the app in another browser/incognito window
5. Sign up with a different account
6. Verify you can see messages in real-time

> **🔍 Troubleshooting**: If something doesn't work, check the [Troubleshooting](#troubleshooting) section below.

## Project Structure

```
realtime-chat/
├── src/
│   ├── components/       # React components
│   │   ├── ChatHeader.jsx
│   │   ├── ChatSidebar.jsx
│   │   ├── ChatWindow.jsx
│   │   └── ...
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── Chat.jsx
│   ├── stores/          # Zustand state management
│   │   ├── useAuthStore.js
│   │   ├── useChatStore.js
│   │   ├── usePresenceStore.js
│   │   └── useUIStore.js
│   ├── lib/            # Utilities and configurations
│   │   ├── supabase.js
│   │   └── utils.js
│   └── utils/          # Helper functions
│       └── logger.js
├── public/             # Static assets
├── sql/                # SQL migration files
│   ├── supabase_schema.sql
│   ├── add_direct_chat_features.sql
│   ├── link_messages_to_profiles.sql
│   └── ...
└── package.json
```

## Architecture Overview

### State Management

The app uses Zustand for state management with four main stores:

- **useAuthStore**: User authentication and session management
- **useChatStore**: Messages, rooms, and chat state
- **usePresenceStore**: Online/offline user presence
- **useUIStore**: UI state (modals, sidebars, etc.)

### Real-Time Architecture

- **Supabase Realtime**: Subscribes to `messages` table changes
- **Presence Channels**: Tracks user online/offline status
- **Postgres Changes**: Listens for INSERT, UPDATE, DELETE events

### Data Flow

1. User sends message → `useChatStore.sendMessage()`
2. Message inserted into Supabase `messages` table
3. Supabase Realtime broadcasts change to all subscribers
4. `useChatStore.subscribeToAllMessages()` receives update
5. UI updates automatically via Zustand state

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- ESLint configuration included
- Follow React best practices
- Use functional components with hooks
- Prefer Zustand for state management

## Deployment

### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

The `netlify.toml` file is already configured with redirects for SPA routing.

### Other Platforms

The app can be deployed to any static hosting service:
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static file server

Just ensure:
- Environment variables are set
- SPA routing is configured (redirect all routes to `index.html`)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

## Troubleshooting

### ❌ "RLS policy violation" or "permission denied" errors

**Cause**: RLS (Row Level Security) policies are not set up correctly.

**Solution**:
1. Go to Supabase dashboard → **SQL Editor**
2. Verify you ran **all 8 SQL files** in order (see Step 6)
3. Check **Authentication** → **Policies** - you should see policies for all tables
4. If policies are missing, re-run the corresponding SQL file:
   - Missing `profiles` policies → Run `sql/fix_profiles_rls.sql`
   - Missing `rooms` policies → Run `sql/fix_rooms_rls.sql`
   - Missing `messages` policies → Run `sql/add_direct_chat_features.sql` again

### ❌ Messages not appearing in real-time

**Cause**: Realtime is not enabled or configured incorrectly.

**Solution**:
1. Go to Supabase dashboard → **Database** → **Replication**
2. Verify `messages` table is listed (if not, run `sql/enable_delete_events.sql` again)
3. Check browser console (F12) for errors
4. Verify environment variables in `.env` are correct
5. Restart your dev server: `npm run dev`

### ❌ Authentication not working

**Cause**: Environment variables missing or Supabase Auth not configured.

**Solution**:
1. **Check `.env` file exists** in project root
2. **Verify values**:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. **No quotes needed** around values in `.env`
4. **Restart dev server** after changing `.env`
5. Go to Supabase → **Authentication** → **Settings**
   - Ensure "Enable email signup" is ON
   - For development, disable "Confirm email" (or handle email confirmation)

### ❌ Profile updates not saving

**Cause**: RLS policy doesn't allow UPDATE on profiles.

**Solution**:
1. Go to Supabase → **Authentication** → **Policies**
2. Find `profiles` table policies
3. Verify there's a policy allowing users to UPDATE their own profile
4. If missing, run `sql/fix_profiles_rls.sql` again
5. Check browser console for specific error messages

### ❌ Direct messages not working

**Cause**: Direct messaging SQL files not executed or function missing.

**Solution**:
1. Verify `sql/add_direct_chat_features.sql` was executed
2. Go to Supabase → **SQL Editor** → Run:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'get_or_create_direct_room';
   ```
   - Should return one row. If empty, re-run `sql/add_direct_chat_features.sql`
3. Check `room_participants` table exists:
   ```sql
   SELECT * FROM room_participants LIMIT 1;
   ```

### ❌ "Table does not exist" errors

**Cause**: Base schema not executed.

**Solution**:
1. Re-run `sql/supabase_schema.sql` first
2. Then run remaining SQL files in order (Step 6)

### ❌ Storage/avatar upload not working

**Cause**: Storage bucket not created or policies missing.

**Solution**:
1. Go to Supabase → **Storage**
2. Verify `avatars` bucket exists
3. If missing, run `sql/setup_storage.sql` again
4. Check bucket is set to **Public**
5. Verify policies allow authenticated users to upload

### ❌ Still having issues?

1. **Check browser console** (F12) for error messages
2. **Check Supabase logs**: Dashboard → **Logs** → **Postgres Logs**
3. **Verify SQL execution**: Each SQL file should show "Success" after running
4. **Double-check environment variables**: Make sure `.env` file is in project root
5. **Restart everything**: Stop dev server, restart, clear browser cache

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Open an issue on GitHub
- Check Supabase documentation: https://supabase.com/docs

## Roadmap

- [ ] Typing indicators
- [ ] Message reactions
- [ ] File attachments
- [ ] Read receipts
- [ ] Message search
- [ ] Group room management
- [ ] User blocking/muting
- [ ] Push notifications
- [ ] Voice/video calls

