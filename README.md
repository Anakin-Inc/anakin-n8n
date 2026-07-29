# n8n-nodes-anakin-org

This is an n8n community node that lets you use the Anakin API in your n8n workflows.

Anakin provides powerful web scraping, AI-powered search, and intelligent data extraction capabilities. This node handles all the complexity of job submission and polling automatically.

## Features

- 🔐 Simple authentication with API key
- 🌐 **Web Scraping**: Scrape any website and extract structured data
- 🔍 **AI Search**: Perform intelligent searches powered by Perplexity AI
- 🤖 **Agentic Search**: Advanced multi-stage pipeline that searches, scrapes, and extracts structured data automatically
- 🗺️ **Map & Crawl**: Discover a site's URLs, or bulk-fetch markdown across many pages
- 🔌 **Wire**: Run pre-built automation actions across hundreds of sites (discover, browse the catalog, run read/write actions, manage identities, sign in, or request a new action)
- 👀 **Website Monitoring**: Create scheduled monitors that watch a page, site, or Wire action for changes and alert via webhook/email
- 🧠 **AI Visibility**: Compare how multiple AI answer engines (ChatGPT, Gemini, Google AI Overview) respond to the same query
- 🗂️ **Browser Sessions**: List and delete saved, authenticated browser sessions
- 🖱️ **Browser Task**: Run a natural-language task in a real AI-driven cloud browser
- ⏳ Automatic polling for async operations
- 🎯 Configurable polling intervals and timeouts
- 🌍 Support for country-specific proxy routing
- ♻️ Cache control with force fresh option

## Installation

### Community Nodes (Recommended)

1. Go to **Settings** > **Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-anakin-org` in the **Package name** field
4. Click **Install**

### Manual Installation

Navigate to your n8n installation folder and run:

```bash
npm install n8n-nodes-anakin-org
```

Then restart n8n.

## Setup

### 1. Configure Credentials

Before using the Anakin node, you need to set up your API credentials:

1. In n8n, go to **Credentials** > **New**
2. Search for **Anakin Scraper API**
3. Fill in:
   - **API Key**: Your Anakin Scraper API authentication token
   - **Base URL**: The API endpoint (default: `https://api.anakin.io`)
4. Click **Save**

### 2. Use in Workflow

1. Add the **Anakin** node to your workflow
2. Connect it to your trigger or previous node
3. Select your credentials
4. Choose an operation (see the full list below)
5. Fill in the required fields and configure any additional options

## Usage

The Anakin node supports 21 operations covering the entire Anakin API: web scraping and AI search, site discovery (Map/Crawl), Wire automation actions, website monitoring, AI visibility comparison, browser session management, and AI-driven browser tasks.

### 1. Scrape URL

Extract content and structured data from any website.

```
Trigger → Anakin (Scrape URL) → Process Data
```

**Configuration:**
- **URL**: `https://example.com/product-page`
- **Country Code**: `us` (optional)
- **Force Fresh**: `false` (optional)
- **Max Wait Time**: `300` seconds (optional)
- **Poll Interval**: `3` seconds (optional)

**Output:**
```json
{
  "success": true,
  "operation": "scrapeUrl",
  "request_id": "req_123456",
  "url": "https://example.com/product-page",
  "status": "completed",
  "html": "...",
  "markdown": "...",
  "generatedJson": {
    // Structured data extracted from the page
  }
}
```

### 2. Search

Perform AI-powered searches using Perplexity AI. Get instant answers with citations.

```
Trigger → Anakin (Search) → Process Results
```

**Configuration:**
- **Search Query**: `What are the latest trends in AI?`
- **Max Results**: `5` (optional, default: 5)

**Output:**
```json
{
  "success": true,
  "operation": "search",
  "query": "What are the latest trends in AI?",
  "answer": "Based on recent developments...",
  "results": [
    {
      "title": "AI Trends 2026",
      "url": "https://example.com/ai-trends",
      "content": "Summary of the article...",
      "score": 0.95
    }
  ],
  "count": 5
}
```

**Use Cases:**
- Research and fact-checking
- Competitive intelligence
- Content research
- Real-time information gathering

### 3. Agentic Search

Advanced multi-stage AI pipeline that automatically:
1. Searches for relevant information
2. Identifies and scrapes citation sources
3. Extracts structured data using AI
4. Generates a comprehensive summary

```
Trigger → Anakin (Agentic Search) → Process Structured Data
```

**Configuration:**
- **Search Prompt**: `Find the pricing plans for top 5 CRM software`
- **Use Browser**: `true` (optional, more reliable)
- **Max Wait Time**: `600` seconds (optional)
- **Poll Interval**: `5` seconds (optional)

**Output:**
```json
{
  "success": true,
  "operation": "agenticSearch",
  "job_id": "job_789",
  "status": "completed",
  "query": "Find the pricing plans for top 5 CRM software",
  "perplexity_answer": "Here are the top CRM solutions...",
  "citations": [
    {"url": "https://salesforce.com/pricing", "title": "Salesforce Pricing", "source_index": 0}
  ],
  "scraped_data": [
    {
      "source_url": "https://salesforce.com/pricing",
      "source_index": 0,
      "data": {
        "plans": [...],
        "features": [...]
      }
    }
  ],
  "chatgpt_schema": {
    "type": "object",
    "properties": {...}
  },
  "chatgpt_structured_data": {
    "crm_platforms": [...]
  },
  "chatgpt_summary": "Comprehensive analysis of CRM pricing..."
}
```

**Use Cases:**
- Market research with structured data
- Competitive analysis
- Lead generation with enriched data
- Automated data collection for reports

### More Operations

Beyond Scrape URL, Search, and Agentic Search, the node exposes the rest of the Anakin API as Operations. Full field-by-field defaults are in [Configuration Options by Operation](#configuration-options-by-operation) below; endpoints are listed in [API Endpoints Used](#api-endpoints-used).

#### Site Discovery

- **Map** — Discover all reachable URLs under a site (structure discovery before crawling). Async; polls to completion.
- **Crawl** — Bulk-fetch markdown across many pages of a site, scoped with include/exclude patterns. Async; polls to completion.

#### Wire (pre-built automation actions across hundreds of sites)

- **Wire: Discover Actions** — Find candidate Wire actions from a natural-language intent (e.g. "top phones on walmart"). Synchronous.
- **Wire: Browse Catalog** — List every supported site, or one site's full action list and parameter schemas. Synchronous.
- **Wire: Run Read Action** — Run a Wire action that extracts data (read-only). Same endpoint and body shape as Run Write Action; split into a separate Operation purely for read/write safety labeling. Async; polls to completion.
- **Wire: Run Write Action** — Run a Wire action that changes state on the target site (submit a form, add to cart, etc.). Async; polls to completion.
- **Wire: List Identities** — List your saved Wire identities and credentials. Synchronous.
- **Wire: Sign In** — Sign in to a credentials-mode Wire site and get a `credential_id` usable with the two action operations above. Synchronous.
- **Wire: Request New Action** — Request a brand-new Wire action for a site not yet in the catalog. Fire-and-forget; returns a pending build status without polling.

#### Website Monitoring

- **Create Monitor** — Create a scheduled monitor that checks a URL (or a whole site, or a Wire action) on an interval (minimum 15 minutes) and records changes, optionally alerting a webhook or email. The richest operation — supports page/site/wire scope, full-page or AI-extracted specific-data watching, and per-scope options (site crawl depth/patterns, Wire action/params). Synchronous — the monitor itself runs on Anakin's schedule.
- **List Monitors** — List your monitors, or fetch one by ID. Synchronous.
- **Get Monitor Changes** — Get the detected changes recorded for a monitor. Synchronous.
- **Control Monitor** — Pause, resume, run now, or permanently delete a monitor. Synchronous.

#### AI Visibility

- **AI Visibility Search** — Ask multiple AI answer engines (ChatGPT, Gemini, Google AI Overview) the same question and compare their answers, with an AI-generated synthesis of where they agree/diverge. Async; polls to completion. A `failed` per-source result is still returned as data, not thrown as an error.
- **AI Visibility Sources** — List the AI answer engines available to AI Visibility Search. Synchronous.

#### Browser Sessions

- **List Sessions** — List your saved, authenticated browser sessions (created via the Anakin dashboard), optionally filtered by domain. Synchronous.
- **Delete Session** — Permanently delete a saved browser session. Synchronous, irreversible.

#### Browser Task

- **Browser Task** — Run a natural-language task in a real AI-driven cloud browser (navigate, click, type, extract) for multi-step flows that Scrape/Crawl can't handle and no Wire action covers. For authenticated tasks, pass a Session ID from List Sessions — never put credentials in the prompt. Async; polls to completion (server hard-caps a run at ~5.5 minutes).

### Configuration Options by Operation

#### Scrape URL Options
| Option | Description | Default |
|--------|-------------|---------|
| **URL** | The website URL to scrape | *Required* |
| **Max Wait Time** | Maximum seconds to wait for completion | 300 |
| **Poll Interval** | Seconds between status checks | 3 |
| **Country Code** | Proxy country code (e.g., us, uk, de) | us |
| **Force Fresh** | Bypass cache and force fresh scrape | false |

#### Search Options
| Option | Description | Default |
|--------|-------------|---------|
| **Search Query** | The question or query to search | *Required* |
| **Max Results** | Maximum number of results to return | 5 |

#### Agentic Search Options
| Option | Description | Default |
|--------|-------------|---------|
| **Search Prompt** | The search prompt for analysis | *Required* |
| **Use Browser** | Use browser for scraping (more reliable) | true |
| **Max Wait Time** | Maximum seconds to wait for completion | 600 |
| **Poll Interval** | Seconds between status checks | 5 |
| **Data Schema (JSON)** | Optional JSON schema for structured data extraction | *None* |

#### Map Options
| Option | Description | Default |
|--------|-------------|---------|
| **URL** | The starting URL for link discovery | *Required* |
| **Limit** | Maximum number of URLs to return overall | 100 |
| **Depth** | How many link-hops from the starting URL to follow | 2 |
| **Limit Per Level** | Maximum URLs collected per depth level | 100 |
| **Include Subdomains** | Include URLs on subdomains of the starting host | false |
| **Include External Links** | Also collect (but not follow) external links | false |
| **Use Browser** | Render with a headless browser (for SPAs) | false |
| **Search Filter** | Optional keyword filter on path/title | *None* |
| **Max Wait Time** | Maximum seconds to wait for completion | 300 |
| **Poll Interval** | Seconds between status checks | 3 |

#### Crawl Options
| Option | Description | Default |
|--------|-------------|---------|
| **URL** | The starting URL to crawl | *Required* |
| **Max Pages** | Hard cap on pages fetched | 10 |
| **Depth** | Link-hops from the starting URL to follow | 1 |
| **Country Code** | Proxy egress country code | us |
| **Use Browser** | Render each page in a headless browser (for SPAs) | false |
| **Include Patterns** | Comma-separated glob/regex patterns; only matching URLs are fetched | *None* |
| **Exclude Patterns** | Comma-separated glob/regex patterns; matching URLs are skipped | *None* |
| **Session ID** | Saved browser-session ID for login-protected sites | *None* |
| **Session Name** | Saved browser-session name | *None* |
| **Max Wait Time** | Maximum seconds to wait for completion | 300 |
| **Poll Interval** | Seconds between status checks | 3 |

#### Wire: Discover Actions Options
| Option | Description | Default |
|--------|-------------|---------|
| **Query** | The intent in natural language | *Required* |
| **Limit** | Maximum number of candidate actions to return | 5 |

#### Wire: Browse Catalog Options
| Option | Description | Default |
|--------|-------------|---------|
| **Catalog Slug** | Site slug to inspect (e.g. "walmart"); leave empty to list all catalogs | *None* |

#### Wire: Run Read Action / Wire: Run Write Action Options
Both operations share the same fields — they hit the identical `POST /wire/task` endpoint and are split only for read/write safety labeling.

| Option | Description | Default |
|--------|-------------|---------|
| **Action ID** | The Wire action to run (from Wire: Discover Actions or Wire: Browse Catalog) | *Required* |
| **Params (JSON)** | The action's input parameters; shape depends on the action | *None* |
| **Credential ID** | Required when the action's auth_mode is "required" | *None* |
| **Identity ID** | Optional identity selector (alternative to Credential ID) | *None* |
| **Max Wait Time** | Maximum seconds to wait when the action runs asynchronously | 300 |
| **Poll Interval** | Default seconds between status checks (the API's own pacing hint is honored when provided) | 3 |

#### Wire: List Identities Options
| Option | Description | Default |
|--------|-------------|---------|
| **Catalog ID** | Optional — restrict to identities for a single catalog | *None* |

#### Wire: Sign In Options
| Option | Description | Default |
|--------|-------------|---------|
| **Catalog Slug** | The catalog to sign in to (e.g. "neb") | *Required* |
| **Login Params (JSON)** | Login fields defined by the catalog (e.g. email/password) | *None* |
| **Identity Name** | Optional name for the identity | *None* |
| **Source ID** | Optional 1Password identity-source ID (alternative to Login Params) | *None* |
| **Source Ref (JSON)** | Optional 1Password item locator `{ vault_id, item_id, fields }` | *None* |

#### Wire: Request New Action Options
| Option | Description | Default |
|--------|-------------|---------|
| **Website URL** | The site to build an action for | *Required* |
| **Goal** | Natural-language description of what the action should do or extract | *Required* |
| **Catalog ID** | Optional — attach to an existing catalog instead of creating one | *None* |
| **Visibility** | Action visibility: Private or Public | private |
| **Force** | Build even if similar actions already exist for the domain | false |

#### Create Monitor Options
| Option | Description | Default |
|--------|-------------|---------|
| **URL** | The URL to watch | *Required* |
| **Interval (Minutes)** | Check frequency in minutes (minimum 15) | 60 |
| **Scope** | Page, Site, or Wire | page |
| **Watch Mode** | Full Page or Specific Data (AI-extracted fields) | full_page |
| **Watch Format** | Format compared in full_page mode: Markdown, HTML, or Cleaned HTML | markdown |
| **Output Schema (JSON)** | JSON Schema of the fields to track; required when Watch Mode is Specific Data | *None* |
| **AI Mode** | Filter trivial noise and summarize real changes with AI (+1 credit/check) | false |
| **AI Goal** | Natural-language description of which changes count as meaningful | *None* |
| **Use Browser** | Render checks with a stealth headless browser | false |
| **Country Code** | Two-letter proxy country code | us |
| **Session ID** | Saved browser-session ID for login-protected pages | *None* |
| **Is Active** | Start running immediately | true |
| **Expires At** | Optional end date (ISO 8601 or YYYY-MM-DD) | *None* |
| **Alert Webhook URL** | Webhook URL that receives signed change alerts | *None* |
| **Alert Emails** | Comma-separated email recipients for change alerts | *None* |
| **Max Pages** | Site scope: max pages crawled per run | *API default* |
| **Max Depth** | Site scope: crawl depth 1-5 | *API default (2)* |
| **Include Patterns** | Site scope: comma-separated patterns/URLs to track | *None* |
| **Exclude Patterns** | Site scope: comma-separated patterns to skip | *None* |
| **Wire Action ID** | Wire scope (required there): the action run each check | *None* |
| **Wire Catalog Slug** | Wire scope: catalog slug of the Wire site | *None* |
| **Wire Credential ID** | Wire scope: credential ID when the action needs auth | *None* |
| **Wire Params (JSON)** | Wire scope: parameters passed to the action each check | *None* |
| **Wire Watch Paths** | Wire scope: comma-separated JSON paths to diff | *None* |

#### List Monitors Options
| Option | Description | Default |
|--------|-------------|---------|
| **Monitor ID** | Optional — fetch just this monitor instead of the full list | *None* |

#### Get Monitor Changes Options
| Option | Description | Default |
|--------|-------------|---------|
| **Monitor ID** | The monitor ID | *Required* |

#### Control Monitor Options
| Option | Description | Default |
|--------|-------------|---------|
| **Monitor ID** | The monitor ID | *Required* |
| **Action** | Pause, Resume, Run Now, or Delete | pause |

#### AI Visibility Search Options
| Option | Description | Default |
|--------|-------------|---------|
| **Query** | The question to ask every AI engine (max 2000 characters) | *Required* |
| **Sources** | Comma-separated engine slugs to query; leave empty for all enabled engines | *None* |
| **Country Code** | Two-letter ISO country for the search geography | us |
| **Include Full Content** | Include each engine's raw full answer in the results (large) | false |
| **Max Wait Time** | Maximum seconds to wait for completion | 180 |
| **Poll Interval** | Seconds between status checks | 3 |

#### AI Visibility Sources Options
No configurable fields.

#### List Sessions Options
| Option | Description | Default |
|--------|-------------|---------|
| **Domain** | Optional — filter to sessions for one website domain | *None* |

#### Delete Session Options
| Option | Description | Default |
|--------|-------------|---------|
| **Session ID** | The session ID to delete | *Required* |

#### Browser Task Options
| Option | Description | Default |
|--------|-------------|---------|
| **Prompt** | The task in natural language; never include passwords or secrets | *Required* |
| **URL** | Navigate here before starting | *None* |
| **Session ID** | Saved browser-session ID so the task runs logged in | *None* |
| **Max Steps** | Cap on agent steps | *API default* |
| **Timeout (Ms)** | Task timeout in milliseconds (server caps runs at ~330s regardless) | *API default* |
| **Output Schema (JSON)** | JSON Schema for the result | *None* |
| **Max Wait Time** | Maximum seconds to wait for completion | 360 |
| **Poll Interval** | Seconds between status checks | 3 |

## How It Works

### Async Operations (Submit → Poll → Return)
Scrape URL, Agentic Search, Map, Crawl, Wire: Run Read/Write Action (when the action isn't synchronous), and AI Visibility Search follow the same pattern:
1. **Submit**: The node submits your request to the Anakin API
2. **Poll**: Automatically checks the job status every few seconds (honoring the server's suggested pacing where provided)
3. **Return**: Once complete, returns the data to your workflow

### Synchronous Operations
Search, Wire: Discover Actions, Wire: Browse Catalog, Wire: List Identities, Wire: Sign In, Wire: Request New Action, Create Monitor, List Monitors, Get Monitor Changes, Control Monitor, AI Visibility Sources, List Sessions, and Delete Session return immediately — no polling required.
1. **Submit**: The node sends your request to the Anakin API
2. **Return**: Immediately returns the response

The node handles all the complexity of:
- Job submission and request management
- Automatic polling for async operations
- Intelligent error handling
- Timeout management
- Response parsing and formatting

## Error Handling

The node will throw an error if:
- The scraping job fails
- The job doesn't complete within the max wait time
- The API returns an error

You can enable **Continue on Fail** in the node settings to handle errors gracefully.

## API Endpoints Used

### Scrape URL
- `POST /v1/request` - Submit scraping job
- `GET /v1/request/{id}` - Check job status

### Search
- `POST /v1/search` - Perform AI search (synchronous)

### Agentic Search
- `POST /v1/agentic-search` - Submit agentic search job
- `GET /v1/agentic-search/{jobId}` - Check agentic search status

### Map
- `POST /v1/map` - Submit mapping job
- `GET /v1/map/{jobId}` - Check job status

### Crawl
- `POST /v1/crawl` - Submit crawl job
- `GET /v1/crawl/{jobId}` - Check job status

### Wire
- `GET /v1/wire/resolve` - Discover candidate actions from a natural-language intent
- `GET /v1/wire/catalog` / `GET /v1/wire/catalog/{slug}` - Browse the Wire catalog
- `POST /v1/wire/task` - Run a Wire action (used by both Run Read Action and Run Write Action)
- `GET /v1/wire/jobs/{jobId}` - Check an async Wire action's job status
- `GET /v1/wire/identities` - List saved identities/credentials
- `POST /v1/wire/login` - Sign in to a credentials-mode site
- `POST /v1/wire/build-request` - Request a new action for an unsupported site

### Website Monitoring
- `POST /v1/monitors` - Create a monitor
- `GET /v1/monitors` / `GET /v1/monitors/{id}` - List monitors / fetch one
- `GET /v1/monitors/{id}/changes` - Get a monitor's detected changes
- `POST /v1/monitors/{id}/pause` / `/resume` / `/run` - Control a monitor
- `DELETE /v1/monitors/{id}` - Delete a monitor

### AI Visibility
- `GET /v1/ai-visibility/sources` - List available AI answer engines
- `POST /v1/ai-visibility/search` - Submit a search
- `GET /v1/ai-visibility/search/{search_id}` - Check search status

### Browser Sessions
- `GET /v1/sessions` - List saved sessions
- `DELETE /v1/sessions/{id}` - Delete a saved session

### Browser Task
- `POST /v1/ai/evaluate` - Submit an AI browser task (async)
- `GET /v1/ai/jobs/{workflow_id}` - Check task status

## Development

### Prerequisites

- Node.js >= 16
- n8n installed locally

### Setup

```bash
# Clone the repository
git clone https://github.com/Anakin-Inc/anakin-n8n.git
cd anakin-n8n

# Install dependencies
npm install

# Build the node
npm run build

# Link for local development
npm link
cd ~/.n8n/custom
npm link n8n-nodes-anakin-org
```

### Project Structure

```
n8n-nodes-anakin-org/
├── credentials/
│   └── AnakinScraperApi.credentials.ts
├── nodes/
│   └── AnakinScraper/
│       └── AnakinScraper.node.ts
├── package.json
└── README.md
```

## Support

For issues, questions, or contributions:
- 🐛 [Report a bug](https://github.com/Anakin-Inc/anakin-n8n/issues)
- 💡 [Request a feature](https://github.com/Anakin-Inc/anakin-n8n/issues)
- 📖 [API Documentation](https://anakin.io/docs)

## License

MIT

## Changelog

### 1.4.0
- Added 18 new Operations covering the full Anakin API surface: Map, Crawl, Wire: Discover Actions, Wire: Browse Catalog, Wire: Run Read Action, Wire: Run Write Action, Wire: List Identities, Wire: Sign In, Wire: Request New Action, Create Monitor, List Monitors, Get Monitor Changes, Control Monitor, AI Visibility Search, AI Visibility Sources, List Sessions, Delete Session, and Browser Task
- The node now exposes 21 of Anakin's 21 REST API capabilities (previously 3)

### 1.3.0
- Added Data Schema (JSON) option to Agentic Search, matching the `schema` parameter already supported by the underlying API

### 1.2.0
- Removed all verbose logger lines per n8n community node review feedback
- Cleaner execution without unnecessary console output

### 1.1.9
- Fixed critical security issue: replaced `Function()` constructor with `sleep` from `n8n-workflow`
- Fixed duplicate `jobId` extraction bug in Scrape URL operation

### 1.1.0
- Added AI-powered Search operation (Perplexity integration)
- Added Agentic Search operation (multi-stage AI pipeline)
- Improved error handling and logging
- Updated node display name to "Anakin"

### 1.0.0
- Initial release
- URL scraping with automatic polling
- Configurable polling intervals and timeouts
- Country-specific proxy support
- Cache control options

