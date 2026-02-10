# n8n-nodes-anakin-org

This is an n8n community node that lets you use the Anakin API in your n8n workflows.

Anakin provides powerful web scraping, AI-powered search, and intelligent data extraction capabilities. This node handles all the complexity of job submission and polling automatically.

## Features

- 🔐 Simple authentication with API key
- 🌐 **Web Scraping**: Scrape any website and extract structured data
- 🔍 **AI Search**: Perform intelligent searches powered by Perplexity AI
- 🤖 **Agentic Search**: Advanced multi-stage pipeline that searches, scrapes, and extracts structured data automatically
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
4. Choose an operation: **Scrape URL**, **Search**, or **Agentic Search**
5. Fill in the required fields and configure any additional options

## Usage

The Anakin node supports three powerful operations:

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

## How It Works

### Scrape URL & Agentic Search (Async)
1. **Submit**: The node submits your request to the Anakin API
2. **Poll**: Automatically checks the job status every few seconds
3. **Return**: Once complete, returns the data to your workflow

### Search (Synchronous)
1. **Submit**: The node sends your query to the Anakin API
2. **Return**: Immediately returns search results with answers and citations

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

