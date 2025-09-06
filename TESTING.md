# How to Test CastLens Translator

## 🚀 Quick Start

1. **Open the app:** <http://localhost:3001>
2. **Click on "🌐 CastLens Translator"** card
3. **Choose mode:**
   - **🔄 Translate to VI** - Translate text to Vietnamese
   - **🤖 Explain (ELI5)** - Get simple explanations

## 📝 Test Examples

### Translation Test

**Input:**

```
DeFi protocols are revolutionizing traditional finance by eliminating intermediaries and providing permissionless access to financial services.
```

**Expected:** Vietnamese translation preserving technical terms

### Explanation Test  

**Input:**

```
What is a smart contract?
```

**Expected:** Easy-to-understand explanation with examples

### Complex Text Test

**Input:**

```
@vitalik.eth just announced a new EIP proposal for #Ethereum that could reduce gas fees by 50%. Check it out: https://eips.ethereum.org/EIPS/eip-4844
```

**Expected:** Translation preserving @handles, #hashtags, and URLs

## 🔗 Testing Frame (Farcaster Integration)

1. **Frame URL:** <http://localhost:3001/frame>
2. **Test in Farcaster:**
   - Copy frame URL
   - Paste in Farcaster cast
   - Or use Frame validator: <https://warpcast.com/~/developers/frames>

3. **Test Frame Actions:**
   - Button 1: Translate to VI
   - Button 2: Explain (ELI5)
   - Input field: Custom questions

## 🛠️ API Testing

### Direct API Test

```bash
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "mode": "translate"}'
```

### Frame API Test

```bash
curl -X POST http://localhost:3001/api/test-frame
```

## 🔍 Debug Endpoints

- **Health check:** <http://localhost:3001/api/health>
- **Cover image:** <http://localhost:3001/api/cover>
- **OG image test:** <http://localhost:3001/api/og?payload={"summary":"Test"}>

## 📱 Mobile Testing

1. **Get network URL:** <http://192.168.1.12:3001>
2. **Open on mobile** to test MiniApp interface
3. **Test touch interactions** and responsive design

## 🎯 Key Features to Test

### ✅ Translation Features

- [x] English to Vietnamese translation
- [x] Preserve @handles, #hashtags, $cashtags
- [x] Maintain URLs and formatting
- [x] Smart "unchanged" detection

### ✅ Explanation Features  

- [x] ELI5 summaries
- [x] Key points extraction
- [x] Technical glossary
- [x] Examples and analogies

### ✅ Interface Features

- [x] Mode switching (Translate/Explain)
- [x] Real-time processing with loading states
- [x] Error handling
- [x] Result formatting

### ✅ Frame Features

- [x] Frame HTML generation
- [x] Dynamic OG images
- [x] Quote result functionality
- [x] Cast content fetching

## 🚨 Common Issues

### API Keys Required

If you see "demo_key" errors:

1. Get real API keys from:
   - **Neynar:** <https://neynar.com>
   - **Gemini:** <https://aistudio.google.com>
2. Update `.env.local`

### Frame Testing

- Use Frame validators for better testing
- Check browser console for errors
- Verify meta tags in frame HTML

### Network Issues

- Ensure firewall allows port 3001
- Check if other services are running on same port
- Test with local IP for mobile devices

## 📊 Performance Notes

- **Cold start:** First AI call may take 2-3 seconds
- **Caching:** Repeated content is cached for 24 hours  
- **Rate limiting:** 20 requests per minute per user
- **Image processing:** Handles up to 3 images per request

## 🎉 Success Indicators

✅ **MiniApp Interface:**

- Translator tab loads without errors
- Mode switching works smoothly
- Results display correctly formatted

✅ **Frame Interface:**

- Frame loads in validators
- Buttons work and return results
- OG images generate properly

✅ **API Responses:**

- Translation preserves formatting
- Explanations include all fields (summary, eli5, key_points, glossary)
- Error handling works gracefully
