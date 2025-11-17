# AstralAI - Multi-Platform Marketing Agent Architecture

## Overview

AstralAI is a multi-platform AI marketing automation system that serves **multiple customers** with **platform-specific content generation agents**. The system is designed to create optimized content for Facebook, Instagram, TikTok, YouTube, and Google Ads - each with their own specialized AI agent.

## Key Concepts

### Company vs Customer
- **AstralAI** = Your company (the service provider)
- **E N Trade LTD** = Example customer (one of many you can manage)

You can add unlimited customers, each with:
- Their own brand settings
- Separate API keys for each platform
- Custom tone of voice and target audience
- Individual platform configurations

## Architecture

### Backend - Platform-Specific Agents

Located in `/backend/app/services/ai/agents/`:

#### 1. **BaseAgent** (`base_agent.py`)
- Abstract base class for all platform agents
- Provides common functionality
- Enforces platform-specific implementations

#### 2. **FacebookAgent** (`facebook_agent.py`)
- **Optimized for**: Storytelling, longer posts (40-80 words)
- **Hashtag Strategy**: 1-3 hashtags maximum
- **Special Features**:
  - Facebook Ads copy generation
  - Primary text, headline, description
  - Conversational, authentic tone

#### 3. **InstagramAgent** (`instagram_agent.py`)
- **Optimized for**: Visual-first, hashtag-heavy (20-30 hashtags)
- **Post Length**: First 125 chars critical (before "more")
- **Special Features**:
  - Strategic hashtag generation (branded + popular + niche)
  - Instagram Reels script generation
  - Carousel post support

#### 4. **TikTokAgent** (`tiktok_agent.py`)
- **Optimized for**: Short, punchy, trend-driven (15-60 sec)
- **Critical**: Hook in first 1-2 seconds
- **Special Features**:
  - Trending sound suggestions
  - Fast-paced script with text overlays
  - Hashtag challenge integration
  - FYP optimization

#### 5. **YouTubeAgent** (`youtube_agent.py`)
- **Optimized for**: Long-form (8-15 min), SEO-focused
- **Critical**: First 15 seconds for retention
- **Special Features**:
  - Timestamped video scripts
  - SEO metadata generation (title, description, tags)
  - Thumbnail text suggestions
  - Engagement optimization

#### 6. **GoogleAdsAgent** (`google_ads_agent.py`)
- **Optimized for**: Keyword relevance, high Quality Score
- **Types**: Search Ads, Display Ads, Shopping Ads
- **Special Features**:
  - Responsive Search Ads (15 headlines, 4 descriptions)
  - Ad extensions (sitelinks, callouts, structured snippets)
  - Character limit enforcement
  - Shopping product title optimization

### Multi-Customer Support

#### Backend Model (`/backend/app/models/customer.py`)

```python
class Customer(Base):
    # Customer Info
    company_name: str
    brand_name: str
    industry: str

    # Brand Identity
    primary_color: str
    secondary_color: str
    tone_of_voice: str

    # Platform API Keys (per customer)
    facebook_access_token: str
    instagram_access_token: str
    tiktok_access_token: str
    youtube_api_key: str
    google_ads_customer_id: str

    # Methods
    get_platform_config(platform)
    get_brand_info()
```

#### Frontend Configuration (`/frontend/lib/config.ts`)

```typescript
interface CustomerConfig {
  companyName: string
  brandName: string
  primaryColor: string
  secondaryColor: string
  toneOfVoice: string
  platforms: {
    facebook?: { accessToken, pageId }
    instagram?: { accessToken, accountId }
    tiktok?: { accessToken }
    youtube?: { apiKey, channelId }
    googleAds?: { customerId, accessToken, developerToken }
  }
}

interface AppConfig {
  // AI Service Keys (shared across customers)
  openaiApiKey: string
  anthropicApiKey?: string

  // Customer Management
  customers: CustomerConfig[]
  currentCustomerId?: string
}
```

### Settings Page Architecture

The settings page (`/frontend/app/settings/page.tsx`) has 4 tabs:

1. **AI Service Keys**
   - OpenAI (required for all content generation)
   - Anthropic (optional, for Claude)
   - D-ID (optional, for avatar videos)
   - ElevenLabs (optional, for voice)

2. **Customers**
   - List all customers
   - Add/Edit/Delete customers
   - Configure brand settings per customer
   - Switch between customers

3. **Platform APIs**
   - Configure API keys per customer per platform
   - Facebook/Instagram (Meta Business API)
   - TikTok
   - YouTube
   - Google Ads

4. **Features**
   - Global feature flags
   - Image generation
   - Video generation
   - Multi-language support

## Platform-Specific Content Differences

### Why Different Agents?

Each platform has unique requirements:

| Platform | Optimal Length | Hashtags | Key Feature |
|----------|---------------|----------|-------------|
| **Facebook** | 40-80 words | 1-3 | Storytelling |
| **Instagram** | 125 chars visible | 20-30 | Visual-first |
| **TikTok** | 100 chars | 3-5 | Trend-driven |
| **YouTube** | Title: 60 chars | 3-5 | SEO-focused |
| **Google Ads** | Headlines: 30 chars | N/A | Keyword-rich |

### Content Generation Flow

```
1. User selects customer (e.g., "E N Trade LTD")
2. User selects platform (e.g., "TikTok")
3. System loads customer's brand info
4. TikTokAgent generates content using:
   - Brand name: "E N Trade LTD"
   - Tone: "professional"
   - Platform guidelines: TikTok-specific
5. Output: Optimized TikTok content (short, punchy, trending)
```

## API Key Management

### Security Model

- **AI Service Keys**: Stored in localStorage, shared across all customers
- **Platform API Keys**: Stored per customer, never sent to backend
- **Encryption**: Browser-level only (consider backend encryption in production)

### Platform API Sources

1. **Facebook/Instagram**: [Meta for Developers](https://developers.facebook.com/)
2. **TikTok**: [TikTok for Business](https://ads.tiktok.com/marketing_api/docs)
3. **YouTube**: [Google Cloud Console](https://console.cloud.google.com/)
4. **Google Ads**: [Google Ads API](https://developers.google.com/google-ads/api)

## Usage Workflow

### 1. Initial Setup
```
1. Go to Settings → AI Service Keys
2. Add your OpenAI API key
3. (Optional) Add other AI service keys
```

### 2. Add Customer
```
1. Go to Settings → Customers
2. Click "+ Add Customer"
3. Fill in:
   - Company Name: "E N Trade LTD"
   - Brand Name: "E N Trade"
   - Colors, tone of voice, target audience
4. Save
```

### 3. Configure Platform APIs
```
1. Go to Settings → Platform APIs
2. Select customer
3. Add API keys for each platform:
   - Facebook access token + page ID
   - Instagram access token + account ID
   - TikTok access token
   - YouTube API key + channel ID
   - Google Ads customer ID + tokens
4. Save
```

### 4. Generate Content
```
1. Select customer from dropdown
2. Select platform (Facebook/Instagram/TikTok/YouTube/Google Ads)
3. Enter product/campaign details
4. Generate → Platform-specific agent creates optimized content
5. Review, edit, publish
```

## Example: Content for Same Product, Different Platforms

**Product**: "Midnight Rose Perfume"

### Facebook Post (FacebookAgent)
```
Discover the enchanting allure of Midnight Rose 🌹✨

This isn't just a fragrance—it's a journey. With delicate notes of Bulgarian rose, warm vanilla, and sensual amber, Midnight Rose captures the essence of elegance and mystery.

Perfect for evening occasions or when you want to leave a lasting impression.

What's your signature scent? Tell us in the comments! 💬

#MidnightRose #LuxuryFragrance
```

### Instagram Post (InstagramAgent)
```
Midnight Rose: Where elegance meets mystery 🌹✨

Top notes: Bulgarian Rose, Bergamot
Heart: Jasmine, Violet
Base: Vanilla, Amber, Musk

Perfect for: Evening wear, Special occasions
Longevity: 8-10 hours

#MidnightRose #PerfumeLover #FragranceOfTheDay #LuxuryPerfume #RosePerfume #EveningScent #BeautyEssentials #PerfumeAddict #ScentOfTheDay #FragranceCommunity #NichePerfume #PerfumeCollection #FragranceReview #BulgarianRose #LuxuryBeauty #PerfumeRecommendation #Fragrantica #ScentLovers #PerfumeObsessed #VanillaScent
```

### TikTok Script (TikTokAgent)
```
[0-2 sec] HOOK: "POV: You just found your signature scent ✨"
[2-5 sec] *spray perfume* "Midnight Rose just hit different"
[5-10 sec] *close-up of bottle* "Bulgarian rose + vanilla + amber = CHEF'S KISS"
[10-15 sec] *twirl* "Lasts 8+ hours, compliments ALL DAY"
[15 sec] "Link in bio! #MidnightRose"

Text Overlays:
- "THE scent that gets compliments"
- "Smells like luxury for $XX"
- "Trust me on this one"

Trending Sound: [Suggest current luxury/beauty trend sound]
```

### YouTube Description (YouTubeAgent)
```
Title: Midnight Rose Perfume Review | Long-Lasting Luxury Fragrance 2024

Description:
In today's video, I'm reviewing the stunning Midnight Rose perfume—a luxurious fragrance that's perfect for evening wear and special occasions!

🌹 WHAT IS MIDNIGHT ROSE?
Midnight Rose is an elegant perfume featuring Bulgarian rose, vanilla, and amber. It's designed for those who appreciate sophistication and want a scent that lasts.

⏰ TIMESTAMPS:
0:00 - Intro
0:45 - Unboxing & First Impressions
2:15 - Fragrance Notes Breakdown
4:30 - Longevity Test
6:45 - Who Should Wear This?
8:20 - Final Verdict
9:30 - Where to Buy

🛍️ WHERE TO BUY:
[Link to product]

#MidnightRose #PerfumeReview #FragranceReview #LuxuryPerfume #BeautyReview
```

### Google Search Ad (GoogleAdsAgent)
```
Headlines:
1. Midnight Rose Luxury Perfume
2. Bulgarian Rose & Vanilla Scent
3. Long-Lasting Evening Fragrance
4. Elegant Perfume for Women
5. 8-10 Hour Wear Time

Descriptions:
1. Discover Midnight Rose: A luxurious blend of Bulgarian rose, vanilla & amber. Perfect for evening wear.
2. Shop our signature fragrance. Free shipping on orders over $50. Premium quality guaranteed.

Sitelinks:
- Shop Now | Free Shipping Available
- Fragrance Notes | See Full Ingredients
- Customer Reviews | 4.8★ Rating
- Gift Sets | Perfect for Gifting

Callouts:
- Free Shipping Over $50
- 30-Day Returns
- Cruelty-Free
- Made in France
- Premium Ingredients
```

## Benefits of Multi-Agent Architecture

1. **Platform Optimization**: Each agent knows platform-specific best practices
2. **Better Performance**: Content performs better on each platform
3. **Time Savings**: No manual adjustment needed per platform
4. **Scalability**: Easy to add new platforms
5. **Consistency**: Brand voice maintained across platforms
6. **Multi-Customer**: Serve multiple customers from one system

## Future Enhancements

- [ ] Auto-posting to platforms via APIs
- [ ] Analytics integration per platform
- [ ] A/B testing content variations
- [ ] Scheduling content calendars
- [ ] Image generation per platform specs
- [ ] Video generation per platform requirements
- [ ] Backend encryption for API keys
- [ ] Team collaboration features
- [ ] Content approval workflows

## Tech Stack

**Backend**:
- FastAPI (Python)
- SQLAlchemy (Database ORM)
- OpenAI GPT-4 (Content Generation)
- Platform-specific agents

**Frontend**:
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- LocalStorage (Configuration Management)

**AI Services**:
- OpenAI (GPT-4 for content)
- Anthropic (Claude - optional)
- D-ID (Avatar videos - optional)
- ElevenLabs (Voice - optional)

## Getting Started

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt

   # Frontend
   cd frontend
   npm install
   ```

2. **Configure Settings**
   - Navigate to `/settings`
   - Add your OpenAI API key
   - Add your first customer
   - Configure platform APIs

3. **Start Generating**
   - Select a customer
   - Choose a platform
   - Generate platform-optimized content!

---

**Built by AstralAI** | Multi-Platform Marketing Automation
