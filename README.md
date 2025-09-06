# CastLens Translator

A Farcaster Frame that translates and explains casts for Vietnamese users, built with:

- [Next.js](https://nextjs.org) & [OnchainKit](https://www.base.org/builders/onchainkit)
- [Gemini AI](https://ai.google.dev) for translation and explanation
- [Neynar API](https://neynar.com) for cast data
- [Vercel OG](https://vercel.com/docs/functions/edge-functions/og-image-generation) for dynamic images

## Features

🌐 **Translate to Vietnamese**: Translate any Farcaster cast to Vietnamese while preserving handles, hashtags, and links
🤖 **Explain (ELI5)**: Get easy-to-understand explanations of complex casts with key points and glossary
📱 **Frame Integration**: Works seamlessly in Warpcast and other Farcaster clients
🎨 **Dynamic OG Images**: Beautiful result cards with translated/explained content

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

- `NEYNAR_API_KEY`: Get from [Neynar Developer Portal](https://neynar.com)
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com)
- `NEXT_PUBLIC_URL`: Your deployment URL (for local: <http://localhost:3000>)
- Redis API keys - Enable Webhooks and background notifications for your application by storing users notification details

```bash
# Shared/OnchainKit variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_URL=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis config
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:

```bash
npm run dev
```

4. Test the Frame:
   - Open `http://localhost:3001/frame` in browser
   - Test API: `POST http://localhost:3001/api/test-frame`
   - Check health: `GET http://localhost:3001/api/health`

## Frame Usage in Farcaster

1. **Development:**
   - Copy Frame URL: `http://localhost:3001/frame`
   - Paste in Farcaster cast to test

2. **Production:**
   - Deploy to Vercel: `vercel --prod`
   - Use production URL: `https://your-app.vercel.app/frame`

## Features

### 🌐 Translation

- Smart Vietnamese translation preserving handles, hashtags, links
- Source language detection
- Formatting preservation

### 🤖 Explanation (ELI5)

- Easy-to-understand summaries
- Key points extraction
- Technical term glossary
- Examples and analogies

### 📱 Frame Integration

- Works in Warpcast and other Farcaster clients
- Dynamic OG image generation
- Quote result functionality

## API Documentation

See [SETUP.md](./SETUP.md) for detailed setup and deployment instructions.

## Architecture

```
Farcaster Cast → Frame → Neynar API → Gemini AI → OG Image → Response
```

### File Structure

```
app/
  frame/route.ts              # Frame HTML endpoint
  api/
    frame/assist/route.ts     # Frame action handler
    og/route.tsx              # Dynamic OG images
    cover/route.tsx           # Cover image
    health/route.ts           # Health check
lib/
  gemini.ts                   # Gemini AI integration
  neynar.ts                   # Neynar API client
  content.ts                  # Content processing
  cache.ts                    # Redis caching
  rate-limit.ts              # Rate limiting
```

## Original Template Features

### Frame Configuration

- `.well-known/farcaster.json` endpoint configured for Frame metadata and account association
- Frame metadata automatically added to page headers in `layout.tsx`

### Background Notifications

- Redis-backed notification system using Upstash
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`

### Theming

- Custom theme defined in `theme.css` with OnchainKit variables
- Pixel font integration with Pixelify Sans
- Dark/light mode support through OnchainKit

### MiniKit Provider

The app is wrapped with `MiniKitProvider` in `providers.tsx`, configured with:

- OnchainKit integration
- Access to Frames context
- Sets up Wagmi Connectors
- Sets up Frame SDK listeners
- Applies Safe Area Insets

## Customization

To get started building your own frame, follow these steps:

1. Remove the DemoComponents:
   - Delete `components/DemoComponents.tsx`
   - Remove demo-related imports from `page.tsx`

2. Start building your Frame:
   - Modify `page.tsx` to create your Frame UI
   - Update theme variables in `theme.css`
   - Adjust MiniKit configuration in `providers.tsx`

3. Add your frame to your account:
   - Cast your frame to see it in action
   - Share your frame with others to start building your community

## Learn More

- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
