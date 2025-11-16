# 📖 AI Marketing Agent - Complete User Guide

## Table of Contents
1. [First-Time Setup](#first-time-setup)
2. [Dashboard Overview](#dashboard-overview)
3. [Creating Your First Product](#creating-your-first-product)
4. [Generating Marketing Content](#generating-marketing-content)
5. [Using the Chat Interface](#using-the-chat-interface)
6. [Managing Brand Assets](#managing-brand-assets)
7. [Reviewing and Editing Content](#reviewing-and-editing-content)
8. [Publishing to Social Media](#publishing-to-social-media)
9. [Tracking Performance](#tracking-performance)
10. [Advanced Features](#advanced-features)
11. [Tips and Best Practices](#tips-and-best-practices)
12. [Troubleshooting](#troubleshooting)

---

## 1. First-Time Setup

### Step 1: Install and Start the Application

**Using Docker (Recommended)**:
```bash
# Navigate to project folder
cd /Users/rotems/AI-PROJECTS/AI-agent

# Copy environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env  # or use any text editor

# Add this line:
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Start all services
docker-compose up -d

# Wait 30 seconds for services to start, then initialize database
docker-compose exec backend alembic upgrade head
```

**Manual Installation**:
```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

# Start PostgreSQL and Redis (install if needed)
brew services start postgresql
brew services start redis

# Create database
createdb ai_marketing_agent

# Start backend
cd ../backend
alembic upgrade head
uvicorn app.main:app --reload

# Start frontend (in new terminal)
cd frontend
npm run dev
```

### Step 2: Access the Application

- **Main App**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000

### Step 3: Verify Everything Works

1. Open http://localhost:3000 - You should see the landing page
2. Open http://localhost:8000/docs - You should see API documentation
3. Click "Health" endpoint and try it out

---

## 2. Dashboard Overview

### Main Navigation

When you open http://localhost:3000, you'll see:

**Header Menu**:
- **Dashboard** - Overview of all your campaigns and content
- **Chat** - Conversational AI interface
- **Products** - Manage your perfume products
- **Settings** - Brand assets and configuration

**Main Sections**:
- **Generate Content** (Hero Button) - Quick content creation
- **Features** - Overview of capabilities
- **How It Works** - Step-by-step guide

### Understanding the Interface

The interface has two main modes:

1. **Web Interface Mode**: Traditional forms and buttons
   - Upload products
   - Fill in details
   - Generate content
   - Review and publish

2. **Chat Mode**: Conversational interface
   - Type what you want
   - AI understands and creates
   - More natural interaction

---

## 3. Creating Your First Product

### Option A: Using the API (Quick Test)

```bash
curl -X POST "http://localhost:8000/api/v1/products/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rose Elegance",
    "category": "Perfume",
    "description": "A luxurious floral fragrance with sophisticated notes",
    "fragrance_notes": {
      "top": ["Rose", "Bergamot", "Citrus"],
      "middle": ["Jasmine", "Lily of the Valley"],
      "base": ["Sandalwood", "Musk", "Vanilla"]
    },
    "scent_family": "Floral",
    "price": "$89.99",
    "tags": ["luxury", "women", "floral", "elegant"]
  }'
```

You should get a response with your product ID.

### Option B: Using the Web Interface (Coming in Full UI)

1. Navigate to **Products** → **New Product**
2. Fill in the form:
   - **Product Name**: e.g., "Rose Elegance"
   - **Category**: Perfume
   - **Description**: Brief description
   - **Fragrance Notes**:
     - Top: Rose, Bergamot, Citrus
     - Middle: Jasmine, Lily
     - Base: Sandalwood, Musk, Vanilla
   - **Scent Family**: Floral
   - **Price**: $89.99
   - **Tags**: luxury, women, floral
3. Upload product image
4. Click **Save Product**

### Understanding Fragrance Notes

**Top Notes** (First impression, lasts 15-30 min):
- Citrus fruits (bergamot, lemon, orange)
- Light florals
- Fresh herbs

**Middle/Heart Notes** (Core scent, lasts 2-4 hours):
- Floral (rose, jasmine, lavender)
- Spices (cinnamon, cardamom)
- Fruits

**Base Notes** (Long-lasting, 4-6+ hours):
- Woods (sandalwood, cedar, oud)
- Musk
- Vanilla
- Amber

💡 **Tip**: Be specific with notes - the AI uses these to create authentic descriptions!

---

## 4. Generating Marketing Content

### The Main Content Generation Endpoint

This is the heart of the system! It generates everything in one go.

### Via API:

```bash
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
    "platforms": ["instagram", "facebook", "tiktok"],
    "languages": ["en"],
    "generate_images": true,
    "generate_videos": false,
    "tone": "luxury"
  }'
```

### What Gets Generated:

✅ **Social Media Posts** (3 variations per platform):
- Instagram: Visual-first, hashtags, emoji-friendly
- Facebook: Story-driven, longer copy
- TikTok: Short, punchy, trend-aware

✅ **Ad Copy**:
- Google Search Ads (headline + description + CTA)
- Facebook Ads (engaging copy optimized for conversion)

✅ **AI Images** (if enabled):
- Product visualization using DALL-E 3
- Platform-optimized sizes
- Professional quality

✅ **Video Scripts**:
- Product showcase script
- Lifestyle video script
- Complete with scenes and timing

✅ **Videos** (if enabled):
- 15-second product showcase
- Zoom and pan effects
- Can be extended to 30s or 60s

### Generation Options Explained:

**platforms**: Choose where you want to post
- `"instagram"` - Square posts (1080x1080)
- `"facebook"` - Landscape (1200x630)
- `"tiktok"` - Vertical (1080x1920)
- `"youtube"` - Landscape videos (1280x720)

**languages**: Generate in multiple languages
- `"en"` - English
- `"es"` - Spanish
- `"fr"` - French
- `"de"` - German
- `"it"` - Italian
- `"pt"` - Portuguese
- `"he"` - Hebrew

**tone**: Brand voice
- `"luxury"` - Sophisticated, elegant, premium
- `"professional"` - Business-like, trustworthy
- `"casual"` - Friendly, approachable, fun

**generate_images**: `true` or `false`
- ⚠️ **Note**: Each image costs ~$0.04-0.08 via DALL-E
- Generates 2 images per request by default

**generate_videos**: `true` or `false`
- ⚠️ **Note**: Video generation takes 30-60 seconds
- Uses background processing (Celery)

### Example Response:

```json
{
  "social_posts": [
    {
      "text": "🌹 Introducing Rose Elegance...",
      "language": "en",
      "platform": "instagram"
    },
    // ... 8 more posts
  ],
  "ad_copies": [
    {
      "type": "google_search",
      "headline": "Rose Elegance - Luxury Perfume",
      "description": "Sophisticated floral notes...",
      "cta": "Shop Now"
    },
    {
      "type": "facebook_ad",
      "headline": "Discover Your Signature Scent",
      "description": "Rose Elegance combines...",
      "cta": "Learn More"
    }
  ],
  "images": [
    "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "https://oaidalleapiprodscus.blob.core.windows.net/..."
  ],
  "videos": [
    "/tmp/Rose_Elegance_video.mp4"
  ],
  "video_scripts": [
    {
      "style": "product_showcase",
      "full_script": "Scene 1 (0-3s): Hook..."
    }
  ]
}
```

---

## 5. Using the Chat Interface

### Starting a Chat Session

```bash
curl -X POST "http://localhost:8000/api/v1/chat/" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Create Instagram posts for Rose Elegance perfume with rose, jasmine, and sandalwood notes"
      }
    ]
  }'
```

### Chat Commands You Can Use:

**Content Generation**:
- "Create Instagram posts for [product name]"
- "Generate Facebook ads for my new perfume"
- "Make a video script for [product]"
- "Translate this post to Spanish"

**Product Information**:
- "Tell me about my products"
- "What's the best way to market floral perfumes?"
- "Suggest hashtags for luxury perfumes"

**Marketing Advice**:
- "When should I post on Instagram?"
- "How can I improve engagement?"
- "What platforms work best for perfume marketing?"

### Example Conversation:

```
You: "I need Instagram content for my new perfume Rose Elegance"

AI: "I can help you create Instagram content! To generate the best posts,
I need a few details:
1. What are the main fragrance notes?
2. Who is your target audience?
3. What tone would you like? (luxury, casual, professional)"

You: "Top notes: rose and bergamot. Middle: jasmine. Base: sandalwood.
Target is women 25-45. Luxury tone."

AI: "Perfect! Generating 3 Instagram post variations for Rose Elegance...
[Shows generated posts]
Would you like me to also create images and videos?"
```

---

## 6. Managing Brand Assets

### Setting Up Your Brand Identity

Brand assets ensure all generated content matches your brand style.

### Via API:

```bash
# Get current brand assets
curl http://localhost:8000/api/v1/brand/

# Update brand assets
curl -X PUT "http://localhost:8000/api/v1/brand/" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "E N Trade LTD",
    "primary_color": "#000000",
    "secondary_color": "#FFFFFF",
    "accent_color": "#D4AF37",
    "tone_of_voice": "luxury",
    "brand_keywords": ["luxury", "elegant", "sophisticated", "timeless"]
  }'
```

### Brand Asset Options:

**Visual Identity**:
- **Logo**: Upload your brand logo (PNG with transparency recommended)
- **Primary Color**: Main brand color (hex code, e.g., #000000)
- **Secondary Color**: Supporting color
- **Accent Color**: Highlight color for CTAs

**Voice & Messaging**:
- **Tone of Voice**: luxury, professional, casual
- **Brand Keywords**: Words that describe your brand
- **Tagline**: Your brand's tagline
- **Brand Values**: What your brand stands for

**Content Guidelines**:
- **Hashtag Strategy**: Platform-specific hashtags
- **Content Templates**: Pre-defined post structures

### Uploading Logo:

```bash
curl -X POST "http://localhost:8000/api/v1/brand/upload-logo" \
  -F "file=@/path/to/your/logo.png"
```

Once set, all generated content will:
- Use your brand colors in images
- Include your logo in videos
- Match your tone of voice
- Use your preferred hashtags

---

## 7. Reviewing and Editing Content

### Understanding Content Versions

Each piece of content can have multiple versions:
- Original AI generation
- User edits
- A/B test variations
- Translations

### Review Workflow:

1. **Generate** content via API
2. **Review** the output
3. **Edit** if needed (manual or regenerate)
4. **Approve** for publishing
5. **Schedule** or publish immediately

### Regenerating Content:

If you're not happy with the output, regenerate with different parameters:

```bash
# Try different tone
{
  "tone": "casual"  // instead of "luxury"
}

# Try different language
{
  "languages": ["es"]  // Spanish
}

# Adjust number of variations
{
  "num_variations": 5  // instead of 3
}
```

### Editing Tips:

**For Social Posts**:
- Keep first line engaging (hook)
- Use 3-5 hashtags for Instagram
- Include clear CTA (Call to Action)
- Mention benefits, not just features

**For Ads**:
- Strong headline (grab attention)
- Clear value proposition
- Specific CTA
- Urgency or scarcity if applicable

**For Videos**:
- Hook in first 3 seconds
- Show product clearly
- Include text overlays
- End with strong CTA

---

## 8. Publishing to Social Media

### Connecting Social Accounts

Before publishing, connect your social media accounts:

```bash
# Connect Facebook/Instagram
curl -X POST "http://localhost:8000/api/v1/social/connect/facebook" \
  -H "Content-Type: application/json" \
  -d '{"access_token": "your_facebook_access_token"}'

# Connect TikTok
curl -X POST "http://localhost:8000/api/v1/social/connect/tiktok" \
  -H "Content-Type: application/json" \
  -d '{"access_token": "your_tiktok_access_token"}'
```

### Getting Access Tokens:

**Facebook/Instagram**:
1. Go to https://developers.facebook.com
2. Create an App
3. Get App ID and Secret
4. Add to `.env` file:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   ```
5. Use OAuth flow to get access token

**TikTok**:
1. Go to https://developers.tiktok.com
2. Register app
3. Get credentials
4. Add to `.env`

**Google Ads**:
1. Go to https://console.cloud.google.com
2. Create project and enable Google Ads API
3. Get credentials
4. Add to `.env`

### Publishing Content:

```bash
curl -X POST "http://localhost:8000/api/v1/social/post" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "content_id": 1,
    "caption": "Your generated caption here...",
    "media_url": "https://your-image-url.jpg",
    "schedule_time": null
  }'
```

### Scheduling Posts:

```bash
{
  "schedule_time": "2024-12-01T10:00:00Z"  // ISO 8601 format
}
```

### Best Posting Times:

**Instagram**:
- Weekdays: 11 AM - 1 PM, 7 PM - 9 PM
- Weekends: 10 AM - 12 PM

**Facebook**:
- Weekdays: 9 AM - 10 AM, 12 PM - 1 PM
- Wednesday: Best overall day

**TikTok**:
- Tuesday, Thursday, Friday: 6 PM - 10 PM
- Early morning (6-10 AM) also performs well

**Instagram Stories**:
- Peak: 9 AM, 12 PM, 5 PM, 9 PM

---

## 9. Tracking Performance

### Viewing Analytics

```bash
# Get dashboard overview
curl http://localhost:8000/api/v1/analytics/dashboard

# Get specific content performance
curl http://localhost:8000/api/v1/analytics/performance/1
```

### Key Metrics:

**Engagement Metrics**:
- **Impressions**: How many people saw your content
- **Reach**: Unique users who saw your content
- **Engagement Rate**: (Likes + Comments + Shares) / Impressions
- **Click-Through Rate (CTR)**: Clicks / Impressions

**Conversion Metrics**:
- **Link Clicks**: Clicks to your website
- **Conversions**: Actual purchases
- **Cost Per Click (CPC)**: Ad spend / clicks
- **Return on Ad Spend (ROAS)**: Revenue / ad spend

### Good Benchmarks:

**Instagram**:
- Engagement Rate: 1-5% (good), 5%+ (excellent)
- Reach: 10-20% of followers

**Facebook**:
- Engagement Rate: 0.5-1% (average), 1%+ (good)
- CTR: 0.9% average

**TikTok**:
- Engagement Rate: 5-10% (good), 10%+ (viral potential)
- Watch Time: 50%+ completion is good

**Google Ads**:
- CTR: 2% average, 4%+ is excellent
- Conversion Rate: 2-5% average

### Optimizing Based on Analytics:

If **low engagement**:
- Try different posting times
- Use more visual content
- Ask questions in captions
- Use trending hashtags

If **low reach**:
- Post more consistently
- Use all platform features (Stories, Reels, etc.)
- Engage with comments quickly
- Use relevant hashtags

If **low conversions**:
- Strengthen CTA
- Improve landing page
- Test different offers
- Retarget engaged users

---

## 10. Advanced Features

### Multi-Language Content Generation

Generate the same content in multiple languages:

```bash
{
  "languages": ["en", "es", "fr", "de"],
  "product_name": "Rose Elegance",
  ...
}
```

This creates 4 versions of every post - one per language!

**Use Cases**:
- European market (EN, FR, DE, IT)
- US Hispanic market (EN, ES)
- Global campaigns

### A/B Testing

Generate multiple variations to test:

```bash
# Generate with different tones
{
  "tone": "luxury"  // Version A
}

{
  "tone": "casual"  // Version B
}
```

Post both and see which performs better!

### Batch Processing

Generate content for multiple products:

```python
products = [
    {"name": "Rose Elegance", "notes": {...}},
    {"name": "Ocean Breeze", "notes": {...}},
    {"name": "Midnight Musk", "notes": {...}}
]

for product in products:
    # Generate content for each
    generate_content(product)
```

### Custom Video Styles

The system supports multiple video styles:

1. **Product Showcase**: Elegant zoom on product
2. **Slideshow**: Multiple images with transitions
3. **AI Avatar**: Talking spokesperson (requires D-ID API)
4. **Lifestyle**: Product + lifestyle footage

Specify in request:
```bash
{
  "video_style": "product_showcase",  // or "slideshow", "avatar", "lifestyle"
  "duration": 15  // 15, 30, or 60 seconds
}
```

### Webhooks and Automation

Set up webhooks to auto-post when new products are added:

```python
# In your e-commerce system:
@app.route('/product/new', methods=['POST'])
def new_product():
    product = request.json

    # Auto-generate marketing content
    content = generate_content(product)

    # Auto-post to social media
    post_to_social(content)

    return {"status": "success"}
```

---

## 11. Tips and Best Practices

### Content Creation Best Practices

**For Perfumes**:
1. **Tell a story**: Connect scent to emotions and memories
2. **Use sensory language**: "Warm vanilla embraces fresh bergamot"
3. **Target specificity**: "Perfect for summer evenings" vs "great fragrance"
4. **Show the lifestyle**: Not just the bottle, but the experience
5. **Include notes clearly**: Customers want to know what they're buying

**Hashtag Strategy**:
- **3-5 hashtags** for Instagram (mix of popular and niche)
- **Popular**: #perfume #fragrance #luxuryperfume (high volume, high competition)
- **Niche**: #floralscent #roseperfume #luxurybeauty (lower volume, targeted)
- **Branded**: #ENTradeLTD #RoseElegance (for tracking)

**Posting Frequency**:
- **Instagram**: 1-2 times daily (feed) + 3-5 stories
- **Facebook**: 1 time daily
- **TikTok**: 1-3 times daily
- **YouTube**: 1-2 times weekly

**Content Mix** (80/20 Rule):
- 80% value/entertainment (lifestyle, tips, behind-the-scenes)
- 20% promotional (direct selling)

### Cost Optimization

**Reduce API Costs**:
1. Generate images selectively (not for every post)
2. Reuse generated content across platforms
3. Cache frequently used prompts
4. Use lower temperature for consistent output

**Example**:
```bash
# Instead of generating 10 unique images
generate_images: true, platforms: ["instagram", "facebook", ...]

# Generate 2 images and reuse
generate_images: true, platforms: ["instagram"]
# Then manually post same image to Facebook
```

**Video Generation**:
- Generate one master video
- Crop/resize for different platforms
- Saves time and money

### Quality Checklist

Before publishing, verify:
- [ ] Brand name spelled correctly
- [ ] Product name accurate
- [ ] No placeholder text
- [ ] Hashtags relevant
- [ ] CTA is clear
- [ ] Image/video quality good
- [ ] Links work
- [ ] Tone matches brand
- [ ] No offensive content
- [ ] Grammar and spelling correct

---

## 12. Troubleshooting

### Common Issues and Solutions

#### Issue: "OpenAI API Error"

**Symptoms**: Generation fails with API error

**Solutions**:
1. Check API key is correct in `.env`
2. Verify you have credits: https://platform.openai.com/account/usage
3. Check rate limits (RPM - Requests Per Minute)
4. Wait a few minutes and retry

```bash
# Test your API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### Issue: "Database connection failed"

**Symptoms**: Backend can't connect to PostgreSQL

**Solutions**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify connection string in .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_marketing_agent
```

#### Issue: "Videos not generating"

**Symptoms**: Video generation endpoint returns error

**Solutions**:
1. Check FFmpeg is installed:
   ```bash
   ffmpeg -version
   ```
2. Install if missing:
   ```bash
   # macOS
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   ```
3. Check Celery worker is running:
   ```bash
   docker-compose logs celery
   ```

#### Issue: "Frontend not loading"

**Symptoms**: http://localhost:3000 shows error

**Solutions**:
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Or manually
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

#### Issue: "Slow performance"

**Symptoms**: Content generation takes too long

**Causes & Solutions**:
- **Too many images**: Limit to 1-2 images per generation
- **Video generation**: Disable if not needed (`generate_videos: false`)
- **Multiple languages**: Start with one language, add more later
- **Large requests**: Break into smaller batches

#### Issue: "Generated content quality is poor"

**Solutions**:
1. **Be more specific with product details**:
   ```json
   // Bad
   "description": "A perfume"

   // Good
   "description": "A sophisticated floral fragrance with French rose, Italian jasmine, and Indian sandalwood, perfect for elegant evening wear"
   ```

2. **Adjust tone**:
   ```json
   "tone": "luxury"  // instead of generic
   ```

3. **Add more context**:
   ```json
   "target_audience": "Women 25-45, professional, urban",
   "brand_values": ["sophistication", "timelessness", "elegance"]
   ```

4. **Try different variations**:
   Generate 5 variations and pick the best

---

## Quick Reference Card

### Most Common Commands

```bash
# Start everything
docker-compose up -d

# Generate content
curl -X POST "http://localhost:8000/api/v1/content/generate" \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Rose Elegance", "fragrance_notes": {...}, "platforms": ["instagram"], "languages": ["en"]}'

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

### Key URLs

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Support Resources

- **Documentation**: See README.md, GETTING_STARTED.md, PROJECT_SUMMARY.md
- **API Reference**: http://localhost:8000/docs
- **Logs**: `docker-compose logs -f`

---

## You're Ready! 🚀

You now have complete knowledge of how to use the AI Marketing Agent. Start by:

1. Creating your first product
2. Generating content for Instagram
3. Reviewing and approving
4. Publishing to social media
5. Tracking performance

**Happy marketing!** 🎉
