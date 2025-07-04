# TCP Agent Platform Setup Instructions

## Environment Setup

### 1. Copy the environment file
```bash
cp .env.example .env.local
```

### 2. Update the following values in `.env.local`:

#### For Remote Supabase (Recommended)
Replace these with your actual Supabase project credentials:
- `[YOUR-PASSWORD]` - Your Supabase database password
- `your_supabase_anon_key_here` - Found in Supabase Dashboard > Settings > API
- `your_supabase_service_role_key_here` - Found in Supabase Dashboard > Settings > API

#### For Local Development (Alternative)
If you want to run Supabase locally:
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start local Supabase
supabase start
```

Then update `.env.local`:
```
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start-output>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start-output>
```

### 3. Generate secure secrets
```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate AUTH_SECRET
openssl rand -hex 32
```

Update these in your `.env.local` file.

### 4. Install dependencies and run
```bash
npm install
npm run dev
```

## Accessing the Application

1. Open http://localhost:3000
2. The default admin user (if migrated from TCP platform):
   - Email: mark.johns@me.com
   - Password: Dal3tplus1

## Testing Agent Registration

1. Navigate to Dashboard > Agents
2. Click "Register Agent"
3. Fill in agent details
4. Copy the registration token
5. On the agent machine, run:
   ```bash
   agent-cli register -token <TOKEN>
   ```

## Troubleshooting

### Database Connection Issues
If you see "POSTGRES_URL environment variable is not set":
1. Ensure `.env.local` exists and contains the correct values
2. Restart the Next.js development server
3. Check that the database password is correct

### Supabase Connection Issues
1. Verify your project URL is correct: `https://qalcyeaxuivvgqukrpzt.supabase.co`
2. Ensure your anon key and service role key are valid
3. Check that your Supabase project is active

### Missing Tables
If you get errors about missing tables:
1. The TCP Agent Platform should already have all required tables
2. Check the Supabase dashboard to verify tables exist
3. If needed, run migrations from the TCP platform repository

## Next Steps

1. Configure Stripe for billing (optional)
2. Set up real-time WebSocket connections
3. Configure ML/AI endpoints
4. Deploy to production