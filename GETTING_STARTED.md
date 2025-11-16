# 🚀 Getting Started with AI Marketing Agent

Welcome to your AI Marketing Agent! This guide will help you get up and running quickly.

## 📋 Prerequisites

Before you begin, make sure you have:

- [ ] **OpenAI API Key** (required for GPT-4 and DALL-E)
- [ ] **Python 3.11+** installed
- [ ] **Node.js 18+** installed
- [ ] **Docker & Docker Compose** (recommended) OR PostgreSQL + Redis installed locally

## ⚡ Quick Start (Recommended - Using Docker)

### 1. Clone and Setup Environment

```bash
cd /Users/rotems/AI-PROJECTS/AI-agent

# Copy environment template
cp .env.example .env
```

### 2. Configure Your API Keys

Edit the `.env` file and add your keys:

```bash
# REQUIRED - Add your OpenAI API key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Generate a random secret key (or use this command):
# python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-super-secret-key-change-this

# Optional but recommended
ANTHROPIC_API_KEY=your-anthropic-key-here
```

### 3. Start All Services with Docker

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend, Celery)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000

### 5. Initialize the Database

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# (Optional) Create a test user
docker-compose exec backend python -c "from app.models.user import User; print('Database ready!')"
```

## 🛠️ Manual Setup (Without Docker)

If you prefer not to use Docker:

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp ../.env.example ../.env
# Edit .env and add your API keys

# Start PostgreSQL (install if needed)
# brew install postgresql (macOS)
# sudo service postgresql start (Linux)

# Start Redis (install if needed)
# brew install redis (macOS)
redis-server &

# Create database
createdb ai_marketing_agent

# Run migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎯 First Steps - Creating Your First Campaign

### Option 1: Using the Web Interface

1. Go to http://localhost:3000
2. Click "Generate Content"
3. Fill in:
   - **Product Name**: e.g., "Rose Elegance"
   - **Category**: Perfume
   - **Fragrance Notes**:
     - Top: Rose, Bergamot
     - Middle: Jasmine, Lily
     - Base: Sandalwood, Musk
4. Upload a product image
5. Select platforms (Instagram, Facebook, TikTok)
6. Click "Generate"
7. Review the AI-generated content
8. Approve and publish!

### Option 2: Using the Chat Interface

1. Go to http://localhost:3000/chat
2. Type: "Create Instagram posts for my new perfume Rose Elegance with notes of rose, jasmine, and sandalwood"
3. The AI will generate content and ask for confirmation

### Option 3: Using the API Directly

```bash
# Test the API
curl -X POST "http://localhost:8000/api/v1/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "product_name": "Rose Elegance",
    "fragrance_notes": {
      "top": ["Rose", "Bergamot"],
      "middle": ["Jasmine", "Lily"],
      "base": ["Sandalwood", "Musk"]
    },
    "platforms": ["instagram", "facebook"],
    "languages": ["en"],
    "generate_images": true,
    "generate_videos": false,
    "tone": "luxury"
  }'
```

## 🎨 Customizing Your Brand

### Upload Brand Assets

1. Go to Settings → Brand Assets
2. Upload your logo
3. Set brand colors:
   - Primary Color
   - Secondary Color
   - Accent Color
4. Choose fonts
5. Set tone of voice (luxury, casual, professional)
6. Save

Now all generated content will use your brand identity!

## 📱 Connecting Social Media Accounts

### Facebook & Instagram (Meta)

1. Go to Settings → Social Accounts
2. Click "Connect Facebook"
3. Follow OAuth flow
4. Grant permissions
5. Select pages/accounts to connect

### TikTok

1. Go to Settings → Social Accounts
2. Click "Connect TikTok"
3. Follow authorization flow

### Google Ads

1. Obtain Google Ads API credentials from Google Cloud Console
2. Add to `.env` file:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
   ```
3. Connect in Settings → Social Accounts

## 🎬 Generating Videos

The system supports multiple video styles:

1. **Product Showcase** - Elegant zoom and pan effects
2. **Slideshow** - Multiple product images with transitions
3. **AI Avatar** - Spokesperson video (requires D-ID API key)
4. **Lifestyle** - Product + B-roll footage

To generate videos:

```python
# Via API
POST /api/v1/content/generate-video
{
  "product_image_url": "https://...",
  "product_name": "Rose Elegance",
  "script": {...},
  "duration": 15
}
```

## 🌍 Multi-Language Support

Supported languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Hebrew (he)

Generate content in multiple languages:

```json
{
  "languages": ["en", "es", "fr"],
  ...
}
```

## 📊 Analytics & Performance Tracking

View analytics at:
- http://localhost:3000/analytics

Metrics include:
- Impressions per platform
- Engagement rates
- Click-through rates
- Top performing content
- Best posting times

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check Redis
docker-compose ps redis
docker-compose logs redis
docker-compose restart redis
```

### API Not Responding

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend

# Or rebuild
docker-compose up -d --build frontend
```

### OpenAI API Errors

- Verify your API key is correct in `.env`
- Check you have credits in your OpenAI account
- Review rate limits

### Video Generation Not Working

- Ensure FFmpeg is installed: `ffmpeg -version`
- Check Celery worker is running: `docker-compose logs celery`
- For AI avatars, verify D-ID API key is set

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains secrets!
2. **Change SECRET_KEY** in production
3. **Use strong passwords** for database
4. **Enable HTTPS** in production
5. **Rotate API keys** regularly
6. **Restrict CORS origins** in production

## 📈 Performance Tips

1. **Image Generation**: Limit to 2-3 images per request (costs can add up)
2. **Video Generation**: Use queues for long-running tasks
3. **Caching**: Redis caches frequently used data
4. **Database**: Index frequently queried fields
5. **Rate Limiting**: Implement rate limiting for public endpoints

## 🆘 Need Help?

- **API Documentation**: http://localhost:8000/docs
- **Check Logs**: `docker-compose logs -f`
- **Restart Everything**: `docker-compose down && docker-compose up -d`

## 🎉 You're Ready!

Your AI Marketing Agent is now running! Start by creating your first product and generating amazing marketing content.

Happy marketing! 🚀
