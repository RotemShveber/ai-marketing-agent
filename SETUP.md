# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your:
   - Project URL
   - Anon/public key
   - Service role key (found in Settings > API)

## Step 3: Set Up Database

1. Go to SQL Editor in your Supabase dashboard
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

**Important Notes:**
- Make sure to enable the `uuid-ossp` extension first
- Enable the `vector` extension for pgvector (for embeddings)
- If you get errors about extensions, run:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "vector";
  ```

## Step 4: Configure Environment

1. Copy `.env.local.example` to `.env.local`
2. Fill in all the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
PIKA_API_KEY=your-pika-key  # Optional
```

## Step 5: Get API Keys

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new secret key
4. Add credits to your account if needed

### Pika Labs API Key (Optional)
1. Sign up at [pika.art](https://pika.art)
2. Get your API key from the dashboard
3. Add to `.env.local`

## Step 6: Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 7: Create Your First Account

1. Go to `/auth/signup`
2. Create an account
3. Complete the onboarding flow
4. Start generating content!

## Troubleshooting

### Database Connection Issues
- Check that your Supabase URL and keys are correct
- Verify that RLS policies are enabled
- Check Supabase logs for errors

### OpenAI API Errors
- Verify your API key is correct
- Check that you have credits in your OpenAI account
- Review rate limits

### Missing Extensions Error
Run in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

## Next Steps

- Set up Supabase Storage buckets for media files
- Configure social media API integrations (Phase 2)
- Set up background job processing (e.g., using BullMQ or Celery)

