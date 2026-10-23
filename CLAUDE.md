# Multi-AI Prompt Generator

Web app that generates optimized LLM prompts using three modes: template-based (no API key), single AI (OpenAI GPT-4o Mini), or multi-AI aggregation (OpenAI + DeepSeek + template baseline, merged by a GPT-4o Mini aggregator pass). Built with vanilla HTML/CSS/JavaScript -- no frameworks.

## Architecture

Single-page app with all logic in one JavaScript file. No build-time framework, no components -- just DOM manipulation and `fetch` calls to AI provider APIs directly from the browser.

```
prompt-maker/
  index.html          # Full UI: method selector, API key inputs, form, flow diagram,
                      #   model result cards, output textarea, troubleshooting modal
  script.js           # All application logic: API calls, UI updates, aggregation
  styles.css          # Custom CSS (no framework, no Tailwind)
  vite.config.ts      # Vite config -- vanilla HTML/JS/CSS, no plugins
  package.json        # Only dev dependency: Vite 6
  .env.example        # Template for OpenAI and DeepSeek API keys
  dist/               # Production build output
  public/
    vite.svg          # Favicon fallback
```

### Generation modes

1. **Template-based**: Instant local string interpolation. No API call. Produces a basic prompt from keywords + tone + length.
2. **Single AI**: Sends a prompt engineering request to OpenAI GPT-4o Mini. System prompt positions the AI as an "expert prompt engineer." Returns the optimized prompt directly.
3. **Multi-AI Aggregation**: Fires requests to all available models in parallel (`Promise.allSettled`), then runs an aggregator pass:
   - OpenAI GPT-4o Mini (required)
   - DeepSeek Chat (optional, only if API key provided)
   - Built-in template (always available, 1s simulated delay)
   - Aggregator: GPT-4o Mini merges all successful outputs into one prompt
   - If aggregator fails, `localAggregatePrompts()` concatenates raw outputs as fallback

### UI elements

- **Method selector**: Three toggle buttons (Template / Single AI / Multi-AI) that show/hide API key inputs
- **Flow diagram**: 4-step visual tracker (Query -> Models -> Aggregation -> Final) that highlights the active step during multi-AI mode
- **Model cards**: Dynamically created cards showing each model's status (pending/complete/error)
- **Troubleshooting modal**: Appears on API errors with debugging guidance for OpenAI, DeepSeek, and network issues
- **Toast notifications**: Custom implementation at bottom of page, auto-dismiss after 3 seconds

## Stack

- **Vanilla HTML5 / CSS3 / JavaScript** (ES modules)
- **Vite 6** (dev server + production bundler)
- **APIs**: OpenAI Chat Completions (GPT-4o Mini), DeepSeek Chat Completions (optional)
- No React, no TypeScript, no UI framework

## Key Patterns

- **API keys in sessionStorage**: Keys entered in the browser are saved to `sessionStorage` (cleared when tab closes). Never persisted to disk or sent anywhere except the respective API provider.
- **30-second timeouts**: Every API call uses `AbortController` with a 30s timeout. Abort errors are caught and shown to the user.
- **Debounce guard**: A global `isGenerating` flag prevents duplicate submissions while a request is in flight.
- **Promise.allSettled for multi-AI**: One model failure does not block the others. Only fulfilled results are passed to the aggregator.
- **Local aggregation fallback**: If the OpenAI aggregator call fails (or OpenAI itself failed), a local function concatenates all successful model outputs with source labels.
- **Shared prompt builder**: `buildPromptMessages()` constructs identical system/user prompts for both single-AI and multi-AI OpenAI calls, ensuring consistency.
- **No server-side code**: All API calls go directly from the browser to provider endpoints. The Vite dev server only serves static files.

## Commands

- `npm install` -- install dev dependencies (just Vite)
- `cp .env.example .env` -- create env file (API keys are optional, entered in browser UI)
- `npm run dev` -- start Vite dev server with hot reload (default: localhost:5173)
- `npm run build` -- production build to `dist/`
- `npm run preview` -- preview the production build locally

## Environment Variables

| Variable | Required | Used by |
|----------|----------|---------|
| `OPENAI_API_KEY` | No (keys entered in browser UI) | Single AI and Multi-AI modes |
| `DEEPSEEK_API_KEY` | No | Multi-AI mode only |

The `.env` file is not actually read by the app at runtime -- API keys are entered directly in the browser and stored in `sessionStorage`.
