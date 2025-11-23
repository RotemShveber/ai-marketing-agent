# Universal AI Marketing Agent

A multi-tenant SaaS platform that uses AI to automatically generate social media content, product images, videos, ad copy, and scheduled posts for multiple businesses.

## 🚀 Features

- **AI Content Generation**: Generate social posts, product descriptions, ad copy, captions, hooks, and CTAs using OpenAI GPT-4
- **AI Image Generation**: Create marketing images using OpenAI DALL·E 3
- **AI Video Generation**: Generate short promotional videos using Pika Labs API
- **Brand Adaptation**: Automatically adapts content to brand tone, industry, and target audience
- **Multi-Tenant Architecture**: Complete tenant isolation with Supabase Row Level Security (RLS)
- **Content Library**: Store and manage all generated content
- **Scheduling System**: Schedule posts across multiple platforms

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL with Row Level Security
- **Storage**: Supabase Storage
- **AI/ML**: 
  - OpenAI GPT-4 for text generation
  - OpenAI DALL·E 3 for image generation
  - Pika Labs API for video generation
  - LangChain + LangGraph for agent orchestration
- **Authentication**: Supabase Auth

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- OpenAI API key
- Pika Labs API key (optional, for video generation)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations:

```bash
# Connect to your Supabase SQL editor and run:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
```

**Important**: Make sure to:
- Enable the `uuid-ossp` extension
- Enable the `vector` extension for embeddings (pgvector)
- Update the JWT secret in the RLS policies if needed

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Pika Labs API Configuration (optional)
PIKA_API_KEY=your_pika_api_key

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── generate-content/
│   │   ├── content/
│   │   ├── schedule/
│   │   └── ...
│   ├── dashboard/         # Dashboard pages
│   ├── auth/              # Authentication pages
│   └── onboarding/        # Onboarding flow
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   └── onboarding/       # Onboarding components
├── lib/                  # Utilities and libraries
│   ├── ai/               # AI agent and tools
│   │   ├── agent.ts      # LangGraph agent orchestration
│   │   ├── tools.ts      # AI generation tools
│   │   └── config.ts     # AI configuration
│   └── supabase/         # Supabase client setup
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
└── public/               # Static assets
```

## 🗄️ Database Schema

The application uses a multi-tenant architecture with the following core tables:

- `tenants` - Business organizations
- `users` - User accounts (extends Supabase auth.users)
- `tenant_users` - Many-to-many relationship between users and tenants
- `brand_profiles` - Brand information and guidelines per tenant
- `content_items` - Generated content (posts, descriptions, etc.)
- `images` - Generated or uploaded images
- `videos` - Generated or uploaded videos
- `scheduled_posts` - Scheduled social media posts
- `embeddings` - Vector embeddings for semantic search
- `audit_logs` - Audit trail of actions

All tables include `tenant_id` for multi-tenant isolation, and Row Level Security (RLS) policies ensure data isolation.

## 🤖 AI Agent Workflow

The content generation process follows this workflow:

1. **Brand Analysis**: Analyzes brand profile if available
2. **Text Generation**: Generates text content for each selected platform
3. **Image Generation**: Creates images using DALL·E 3 (if requested)
4. **Video Generation**: Creates videos using Pika Labs (if requested)
5. **Storage**: Saves all generated content to Supabase
6. **Audit Logging**: Records all actions for compliance

## 🚧 Current Status

### ✅ Completed Features
- Multi-tenant database schema with RLS
- Authentication with Supabase Auth
- AI agent orchestration (LangChain + LangGraph)
- Text generation with OpenAI GPT-4
- Image generation with OpenAI DALL·E 3
- Video generation integration (Pika Labs API)
- Content library UI
- Scheduling UI
- Dashboard with tab navigation

### 🔄 Next Steps (Phase 2)
- Background job queue for async content generation
- Analytics dashboard
- Brand templates
- Custom video voiceover
- Auto-posting integrations (Instagram, Facebook, TikTok, LinkedIn)
- Enhanced scheduling with calendar view
- Content approval workflows
- Team collaboration features

## 📝 API Endpoints

### Content Generation
- `POST /api/generate-content` - Generate AI content

### Content Management
- `GET /api/content` - List content items
- `GET /api/content?id={id}` - Get specific content item

### Scheduling
- `POST /api/schedule` - Schedule a post
- `GET /api/schedule` - Get scheduled posts

### Tenants & Users
- `POST /api/tenants` - Create a new tenant
- `POST /api/tenant-users` - Add user to tenant
- `POST /api/brand-profiles` - Create brand profile

## 🔒 Security

- All API routes require authentication
- Row Level Security (RLS) ensures tenant data isolation
- Service role key only used server-side for admin operations
- User permissions managed through `tenant_users` roles

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

