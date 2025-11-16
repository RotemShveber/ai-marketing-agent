# 🎯 AI Marketing Agent for E N Trade LTD

An intelligent AI-powered marketing automation platform for beauty and perfume e-commerce, specializing in automated content creation across all digital channels.

## 🌟 Features

### Core Capabilities
- **AI Content Generation**: Automated copywriting for ads, posts, and captions
- **Multi-Format Video Creation**: Product showcases, slideshows, AI avatars
- **Image Processing**: Brand overlays, text effects, automated editing
- **Multi-Language Support**: Create content in multiple languages automatically
- **Social Media Integration**: Direct posting to Meta, TikTok, Google Ads, YouTube
- **Dual Interface**: Web dashboard + conversational chat interface
- **Review Workflow**: Preview and approve content before publishing
- **Brand Management**: Custom logos, colors, fonts, and style guides
- **Analytics Dashboard**: Track performance across all channels

### Input → Output
**Input**: Product image + name + fragrance notes
**Output**: Ready-to-post marketing materials for all platforms

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **AI Models**: OpenAI GPT-4, DALL-E 3, Claude 3.5 Sonnet
- **Video Generation**: Runway ML, D-ID, FFmpeg
- **Database**: PostgreSQL + Redis
- **Task Queue**: Celery
- **Storage**: AWS S3 / Cloudflare R2

### Frontend
- **Framework**: Next.js 14 (React 18, TypeScript)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Chat Interface**: Vercel AI SDK
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation

### Infrastructure
- **Container**: Docker + Docker Compose
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **CDN**: Cloudflare
- **Monitoring**: Sentry

## 📦 Project Structure

```
ai-marketing-agent/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── v1/
│   │   │   │   ├── content.py
│   │   │   │   ├── media.py
│   │   │   │   ├── social.py
│   │   │   │   └── chat.py
│   │   ├── core/              # Configuration
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   │   ├── ai/
│   │   │   │   ├── content_generator.py
│   │   │   │   ├── image_processor.py
│   │   │   │   └── video_generator.py
│   │   │   ├── social_media/
│   │   │   │   ├── meta.py
│   │   │   │   ├── tiktok.py
│   │   │   │   ├── google_ads.py
│   │   │   │   └── youtube.py
│   │   │   └── brand/
│   │   │       └── assets_manager.py
│   │   ├── schemas/           # Pydantic schemas
│   │   └── tasks/             # Celery tasks
│   ├── tests/
│   ├── alembic/               # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # App router
│   │   ├── (dashboard)/
│   │   │   ├── products/
│   │   │   ├── campaigns/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── chat/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── forms/
│   │   ├── media/
│   │   └── chat/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (optional but recommended)
- PostgreSQL 15+ (or use Docker)
- Redis (or use Docker)

### Environment Setup

1. **Clone and navigate to project**
```bash
cd ai-marketing-agent
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

Required API keys:
- OpenAI API key
- Anthropic API key (optional, for Claude)
- Meta Business API credentials
- TikTok API credentials
- Google Ads API credentials
- AWS S3 or Cloudflare R2 credentials

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database
alembic upgrade head

# Start services
redis-server &
celery -A app.tasks.celery_app worker --loglevel=info &
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 💡 Usage

### Web Interface Mode

1. **Upload Product**: Navigate to Products → New Product
   - Upload product image
   - Enter product name
   - Add fragrance notes
   - Select target platforms

2. **Generate Content**: Click "Generate Marketing Materials"
   - AI creates copy variations
   - Generates branded images
   - Creates videos (multiple styles)
   - Provides platform-specific versions

3. **Review & Approve**: Review all generated content
   - Edit if needed
   - Select preferred versions
   - Schedule or post immediately

### Chat Interface Mode

Simply chat with the agent:
```
You: "Create Instagram content for Rose Elegance perfume with
notes of rose, jasmine, and sandalwood"

Agent: "I'll create content for Rose Elegance. Give me a moment
to generate multiple variations..."
[Shows generated content with preview]
```

## 🎨 Customization

### Brand Assets
Upload your brand assets in Settings:
- Logo (PNG with transparency)
- Brand colors (primary, secondary, accent)
- Fonts (Google Fonts or custom)
- Style guidelines

### Content Templates
Customize templates for each platform:
- Post formats
- Video styles
- Tone of voice
- Hashtag strategies

## 📊 Analytics

Track performance metrics:
- Engagement rates per platform
- Best performing content types
- Optimal posting times
- ROI by campaign

## 🔐 Security

- API key encryption at rest
- OAuth 2.0 for social media integrations
- Role-based access control
- Audit logging for all actions

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Backend linting
cd backend
black . && isort . && flake8

# Frontend linting
cd frontend
npm run lint
```

## 📝 API Documentation

Interactive API documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

This is a private project for E N Trade LTD.

## 📄 License

Proprietary - All rights reserved by E N Trade LTD

## 🆘 Support

For questions or issues, contact the development team.

---

Built with ❤️ for E N Trade LTD's digital marketing success
