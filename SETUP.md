# CastLens Translator - Setup Guide

## Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

- `NEYNAR_API_KEY`: Get from [Neynar Developer Portal](https://neynar.com)
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com)
- `NEXT_PUBLIC_URL`: Your deployment URL

3. **Start development server:**

```bash
npm run dev
```

## API Endpoints

### Frame Endpoints

- `GET /frame` - Main Frame HTML for Farcaster
- `POST /api/frame/assist` - Frame action handler (translate/explain)

### Image Generation

- `GET /api/cover` - Dynamic cover image for Frame
- `GET /api/og?payload=...` - Dynamic OG images for results

### Utilities

- `GET /api/health` - Health check endpoint

## Frame Usage

1. **In Development:**
   - Open `http://localhost:3001/frame` in browser
   - Copy URL and paste in Farcaster cast
   - Or use Frame validators like: <https://warpcast.com/~/developers/frames>

2. **Testing Frame Actions:**
   - Frame shows 2 buttons: "Translate to VI" and "Explain (ELI5)"
   - Input field allows custom questions
   - Frame fetches cast content using Neynar API
   - Processes with Gemini AI
   - Returns dynamic OG image with results

## Deployment

### Vercel (Recommended)

1. **Deploy to Vercel:**

```bash
vercel --prod
```

2. **Set environment variables in Vercel dashboard:**
   - `NEYNAR_API_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_URL` (auto-set by Vercel)

3. **Update Frame URL:**
   - Use your Vercel URL: `https://your-app.vercel.app/frame`

### Other Platforms

Works on any platform supporting Next.js Edge Runtime:

- Netlify
- Railway
- Render
- etc.

## Features

### Translation

- Preserves @handles, #hashtags, $cashtags
- Maintains original formatting
- Detects source language
- Smart unchanged detection

### Explanation

- ELI5 summaries
- Key points extraction
- Glossary for technical terms
- Examples and analogies

### Caching

- Content-based caching with Upstash Redis (optional)
- Rate limiting per user
- Efficient image processing

## Architecture

```
Frame Request → Validation → Content Fetch (Neynar) → AI Processing (Gemini) → OG Image → Response
```

### Key Files

- `/app/frame/route.ts` - Main Frame HTML
- `/app/api/frame/assist/route.ts` - Action handler
- `/app/api/og/route.tsx` - Dynamic OG images
- `/lib/gemini.ts` - AI integration
- `/lib/neynar.ts` - Cast data fetching
- `/lib/content.ts` - Content processing utilities

## API Keys Setup

### Neynar API Key

1. Go to [Neynar Developer Portal](https://neynar.com)
2. Sign up and create an API key
3. Add to `.env.local` as `NEYNAR_API_KEY`

### Gemini API Key  

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Add to `.env.local` as `GEMINI_API_KEY`

### Upstash Redis (Optional)

1. Create account at [Upstash](https://upstash.com)
2. Create Redis database
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

## Troubleshooting

### Frame Not Loading

- Check Frame HTML meta tags
- Verify `NEXT_PUBLIC_URL` is correct
- Test with Frame validator: <https://warpcast.com/~/developers/frames>

### API Errors

- Verify API keys are correct
- Check network connectivity
- Monitor server logs for detailed errors

### Build Issues

- Ensure all dependencies are installed
- Check TypeScript errors
- Verify environment variables

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see LICENSE file for details.
