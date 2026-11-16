# SignBridge AI Frontend

## Development

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Production Build

```bash
npm run build
```

## Project Structure

- `src/components/` - Reusable UI components and Layout
- `src/pages/` - Six division pages (SignIntelligence, CommunicationHub, AIAvatarStudio, AccessibilityNetwork, LearningCommunity, TrustResearch)
- `src/hooks/` - Custom React hooks (useCamera, useSignRecognition)
- `src/lib/` - Utility functions (api client, helpers)
- `src/App.tsx` - Main router configuration with BrowserRouter

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run preview` - Preview production build