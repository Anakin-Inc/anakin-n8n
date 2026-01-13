# n8n-nodes-anakin-org

[![npm version](https://img.shields.io/npm/v/n8n-nodes-anakin-org.svg)](https://www.npmjs.com/package/n8n-nodes-anakin-org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful n8n community node that brings Anakin's advanced web scraping, AI-powered search, and intelligent data extraction capabilities to your n8n workflows.

## 🚀 Features

- **🌐 Web Scraping**: Extract structured data from any website with automatic polling
- **🔍 AI Search**: Perform intelligent searches powered by Perplexity AI
- **🤖 Agentic Search**: Advanced multi-stage pipeline that searches, scrapes, and extracts structured data automatically
- **⏳ Smart Polling**: Automatic job status polling for async operations
- **🎯 Configurable**: Customizable polling intervals, timeouts, and proxy routing
- **🔐 Secure**: Simple API key authentication

## 📦 Installation

### Option 1: Community Nodes (Recommended)

1. Open your n8n instance
2. Navigate to **Settings** > **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-anakin-org` as the package name
5. Click **Install**
6. Restart n8n

### Option 2: Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-anakin-org
```

Then restart your n8n instance.

### Option 3: Docker

Add to your `docker-compose.yml`:

```yaml
environment:
  - N8N_CUSTOM_EXTENSIONS=n8n-nodes-anakin-org
```

## 🔧 Quick Start

### 1. Get Your API Key

Visit [Anakin](https://anakin.io) to obtain your API key.

### 2. Configure Credentials in n8n

1. In n8n, go to **Credentials** > **New**
2. Search for **Anakin Scraper API**
3. Enter your API Key and Base URL (`https://api.anakin.io`)
4. Save the credentials

### 3. Add to Workflow

1. Add the **Anakin** node to your workflow
2. Select your configured credentials
3. Choose an operation (Scrape URL, Search, or Agentic Search)
4. Configure the parameters
5. Run your workflow!

## 💡 Use Cases

### Web Scraping
- **E-commerce monitoring**: Track product prices and availability
- **Content aggregation**: Collect articles and blog posts
- **Lead generation**: Extract contact information from websites
- **Competitor analysis**: Monitor competitor websites

### AI Search
- **Research automation**: Get instant answers with citations
- **Content research**: Gather information for articles and reports
- **Fact-checking**: Verify information with sourced results
- **Market intelligence**: Stay updated on industry trends

### Agentic Search
- **Structured data collection**: Extract pricing tables, feature lists, etc.
- **Market research**: Automated competitor analysis with structured output
- **Lead enrichment**: Gather and structure company information
- **Report generation**: Collect and summarize data from multiple sources

## 📚 Operations

### Scrape URL
Extracts content and structured data from any website.

**Parameters:**
- URL (required)
- Max Wait Time (optional, default: 300s)
- Poll Interval (optional, default: 3s)
- Country Code (optional, default: us)
- Force Fresh (optional, default: false)

**Output:** HTML, Markdown, and structured JSON data

### Search
Performs AI-powered searches using Perplexity AI.

**Parameters:**
- Search Query (required)
- Max Results (optional, default: 5)

**Output:** Answer with citations and source links

### Agentic Search
Advanced multi-stage AI pipeline for comprehensive data extraction.

**Parameters:**
- Search Prompt (required)
- Use Browser (optional, default: true)
- Max Wait Time (optional, default: 600s)
- Poll Interval (optional, default: 5s)

**Output:** Structured data with citations, summaries, and schemas

## 🛠️ Development

### Prerequisites

- Node.js >= 16
- npm or yarn
- n8n (for testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/Anakin-Inc/anakin-n8n.git
cd anakin-n8n/n8n

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
cd ~/.n8n/custom
npm link n8n-nodes-anakin-org
```

### Available Scripts

```bash
npm run build        # Build the TypeScript code
npm run dev          # Watch mode for development
npm run format       # Format code with Prettier
npm run lint         # Lint code with ESLint
npm run lintfix      # Fix linting issues automatically
```

### Project Structure

```
n8n-nodes-anakin-org/
├── LICENSE
└── n8n/
    ├── credentials/
    │   └── AnakinScraperApi.credentials.ts
    ├── nodes/
    │   └── AnakinScraper/
    │       ├── AnakinScraper.node.ts
    │       └── anakin.png
    ├── dist/                  # Compiled output
    ├── package.json
    ├── tsconfig.json
    ├── gulpfile.js
    └── README.md
```

## 🧪 Testing

After linking the node locally:

1. Start your local n8n instance
2. Create a new workflow
3. Add the Anakin node
4. Configure test credentials
5. Test each operation with sample data

## 📖 Documentation

- [Full Documentation](https://github.com/Anakin-Inc/anakin-n8n/blob/main/n8n/README.md)
- [Anakin API Docs](https://anakin.io/docs)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🐛 Bug Reports & Feature Requests

- [Report a Bug](https://github.com/Anakin-Inc/anakin-n8n/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/Anakin-Inc/anakin-n8n/issues/new?template=feature_request.md)

## 📝 Changelog

### Version 1.1.0
- ✨ Added AI-powered Search operation (Perplexity integration)
- ✨ Added Agentic Search operation (multi-stage AI pipeline)
- 🐛 Improved error handling and logging
- 📝 Updated documentation

### Version 1.0.0
- 🎉 Initial release
- ✨ URL scraping with automatic polling
- ⚙️ Configurable polling intervals and timeouts
- 🌍 Country-specific proxy support
- ♻️ Cache control options

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the [n8n](https://n8n.io) community
- Powered by [Anakin](https://anakin.io)
- Icons and assets by Anakin

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/n8n-nodes-anakin-org)
- [GitHub Repository](https://github.com/Anakin-Inc/anakin-n8n)
- [Anakin Website](https://anakin.io)
- [n8n Website](https://n8n.io)

## 💬 Support

For questions and support:
- 📧 Email: technology@anakin.company
- 🐛 [GitHub Issues](https://github.com/Anakin-Inc/anakin-n8n/issues)
- 📖 [Documentation](https://anakin.io/docs)

---

Made with ❤️ by the Anakin team
