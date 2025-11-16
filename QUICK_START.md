# ⚡ QUICK START - AI Marketing Agent

## 🎯 What You Have

A complete AI-powered marketing platform that creates content for perfumes automatically!

**Input**: Product image + name + fragrance notes
**Output**: Social posts, ads, images, and videos for all platforms

---

## 🚀 Start in 3 Steps

### Step 1: Add Your API Key
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI key:
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=change-this-to-something-random
```

### Step 2: Start Everything
```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# Initialize database
docker-compose exec backend alembic upgrade head
```

### Step 3: Open Browser
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

---

## 🎨 Create Your First Campaign

### Option A: Web Interface
1. Go to http://localhost:3000
2. Click "Generate Content"
3. Fill in:
   - Product: "Rose Elegance"
   - Notes: Rose, Jasmine, Sandalwood
4. Upload image
5. Click "Generate"
6. Review and approve!

### Option B: API
```bash
curl -X POST "http://localhost:8000/api/v1/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Rose Elegance",
    "fragrance_notes": {
      "top": ["Rose", "Bergamot"],
      "middle": ["Jasmine"],
      "base": ["Sandalwood", "Musk"]
    },
    "platforms": ["instagram", "facebook"],
    "languages": ["en"],
    "generate_images": true,
    "generate_videos": false,
    "tone": "luxury"
  }'
```

---

## 📂 Project Structure

```
AI-agent/
├── backend/              # FastAPI + AI Services
│   ├── app/
│   │   ├── api/v1/       # REST endpoints
│   │   ├── models/       # Database models
│   │   └── services/ai/  # AI magic happens here!
│   │       ├── content_generator.py  # GPT-4
│   │       ├── image_processor.py    # DALL-E
│   │       └── video_generator.py    # FFmpeg
│   └── requirements.txt
│
├── frontend/             # Next.js + React
│   ├── app/              # Pages
│   ├── components/       # UI components
│   └── package.json
│
├── docker-compose.yml    # Run everything
├── .env                  # Your secrets
└── README.md             # Full docs
```

---

## 🎯 Key Features

✅ **AI Content**: GPT-4 generates posts & ads
✅ **AI Images**: DALL-E creates product visuals
✅ **AI Videos**: Automated video generation
✅ **Multi-Language**: 7 languages supported
✅ **All Platforms**: Instagram, Facebook, TikTok, YouTube, Google
✅ **Brand Assets**: Logo, colors, fonts
✅ **Analytics**: Track performance

---

## 🛠️ Useful Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Check status
docker-compose ps
```

---

## 📝 API Endpoints

- `POST /api/v1/content/generate` - **Main endpoint** (generates everything)
- `POST /api/v1/content/generate-image` - Generate image only
- `POST /api/v1/content/generate-video` - Generate video only
- `POST /api/v1/chat` - Chat with AI agent
- `GET /api/v1/products` - List products
- Full docs: http://localhost:8000/docs

---

## 🐛 Troubleshooting

**Backend not starting?**
```bash
docker-compose logs backend
docker-compose restart backend
```

**Frontend not loading?**
```bash
docker-compose logs frontend
cd frontend && npm install
docker-compose restart frontend
```

**Database errors?**
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

---

## 📚 More Info

- **Full Guide**: See `GETTING_STARTED.md`
- **Technical Details**: See `PROJECT_SUMMARY.md`
- **Main Docs**: See `README.md`

---

## ✅ What's Implemented

✅ FastAPI backend with all endpoints
✅ AI content generation (GPT-4)
✅ AI image generation (DALL-E)
✅ AI video generation (FFmpeg)
✅ Database models (PostgreSQL)
✅ Next.js frontend with landing page
✅ Docker setup (one command to run)
✅ API documentation (Swagger)
✅ Multi-language support
✅ Social media integrations (framework)
✅ Analytics (framework)

---

## 🚀 You're Ready!

The entire system is built and ready to use. Just add your OpenAI API key and start generating amazing marketing content!

**Need help?** Check the logs: `docker-compose logs -f`

**Happy marketing! 🎉**
