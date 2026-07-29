import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	sleep,
	NodeOperationError,
} from 'n8n-workflow';

// Parse a user-supplied JSON field (a raw string from a `type: 'json'` property, or an
// already-resolved object when the field was set via an expression). Returns undefined
// when the field is empty/unset. Mirrors the Agentic Search "Data Schema (JSON)" idiom.
function parseJsonField(
	node: IExecuteFunctions,
	itemIndex: number,
	raw: unknown,
	fieldLabel: string,
): any {
	if (raw === undefined || raw === null || raw === '') {
		return undefined;
	}
	if (typeof raw === 'object') {
		return raw;
	}
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed === '') {
			return undefined;
		}
		try {
			return JSON.parse(trimmed);
		} catch {
			throw new NodeOperationError(
				node.getNode(),
				`${fieldLabel} must be valid JSON`,
				{ itemIndex },
			);
		}
	}
	return undefined;
}

// Parse a comma-separated string field into a trimmed, non-empty string array.
// Returns undefined when the field is empty so callers can omit it from the request body.
function parseListField(raw: unknown): string[] | undefined {
	if (typeof raw !== 'string' || raw.trim() === '') {
		return undefined;
	}
	const items = raw
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
	return items.length > 0 ? items : undefined;
}

// Clamp a number between min and max (used to bound server-suggested poll pacing hints).
function clampNumber(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export class AnakinScraper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Anakin',
		name: 'anakinScraper',
		icon: 'file:anakin.png',
		group: ['transform'],
		version: 1,
		description: 'Scrape websites, search with AI, and extract structured data',
		defaults: {
			name: 'Anakin',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'anakinScraperApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Scrape URL',
						value: 'scrapeUrl',
						description: 'Scrape a website and extract content',
						action: 'Scrape a website URL',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Perform an AI-powered search query',
						action: 'Perform AI search',
					},
					{
						name: 'Agentic Search',
						value: 'agenticSearch',
						description: 'Advanced multi-stage AI search with automatic scraping and data extraction',
						action: 'Perform agentic search',
					},
					{
						name: 'Map',
						value: 'map',
						description: 'Discover all reachable URLs under a site (site structure discovery)',
						action: 'Map a website\'s URLs',
					},
					{
						name: 'Crawl',
						value: 'crawl',
						description: 'Bulk-fetch markdown content across many pages of a site',
						action: 'Crawl a website',
					},
					{
						name: 'Wire: Discover Actions',
						value: 'wireDiscover',
						description: 'Find pre-built Wire automation actions for a task from a natural-language intent',
						action: 'Discover Wire actions',
					},
					{
						name: 'Wire: Browse Catalog',
						value: 'wireCatalog',
						description: 'List all Wire catalog sites, or one site\'s full action list and parameter schemas',
						action: 'Browse the Wire catalog',
					},
					{
						name: 'Wire: Run Read Action',
						value: 'wireReadAction',
						description: 'Run a Wire action that extracts data (read-only, e.g. search listings, get a product\'s price)',
						action: 'Run a Wire read action',
					},
					{
						name: 'Wire: Run Write Action',
						value: 'wireWriteAction',
						description: 'Run a Wire action that changes state on the target site (e.g. submit a form, add to cart)',
						action: 'Run a Wire write action',
					},
					{
						name: 'Wire: List Identities',
						value: 'wireIdentities',
						description: 'List your saved Wire identities and credentials',
						action: 'List Wire identities',
					},
					{
						name: 'Wire: Sign In',
						value: 'wireLogin',
						description: 'Sign in to a credentials-mode Wire site and get a credential ID',
						action: 'Sign in to a Wire site',
					},
					{
						name: 'Wire: Request New Action',
						value: 'wireBuild',
						description: 'Request a brand-new Wire action for a website not yet in the catalog',
						action: 'Request a new Wire action',
					},
					{
						name: 'Create Monitor',
						value: 'monitorCreate',
						description: 'Create a scheduled monitor that watches a URL, site, or Wire action for changes',
						action: 'Create a website monitor',
					},
					{
						name: 'List Monitors',
						value: 'monitorList',
						description: 'List your website monitors, or fetch one monitor\'s configuration and status',
						action: 'List website monitors',
					},
					{
						name: 'Get Monitor Changes',
						value: 'monitorChanges',
						description: 'Get the detected changes recorded for a monitor',
						action: 'Get monitor changes',
					},
					{
						name: 'Control Monitor',
						value: 'monitorControl',
						description: 'Pause, resume, run now, or delete an existing monitor',
						action: 'Control a website monitor',
					},
					{
						name: 'AI Visibility Search',
						value: 'aiVisibilitySearch',
						description: 'Ask multiple AI answer engines the same question and compare their answers',
						action: 'Compare AI engine answers',
					},
					{
						name: 'AI Visibility Sources',
						value: 'aiVisibilitySources',
						description: 'List the AI answer engines available to AI Visibility Search',
						action: 'List AI visibility engines',
					},
					{
						name: 'List Sessions',
						value: 'sessionList',
						description: 'List your saved browser sessions',
						action: 'List saved browser sessions',
					},
					{
						name: 'Delete Session',
						value: 'sessionDelete',
						description: 'Permanently delete a saved browser session',
						action: 'Delete a saved browser session',
					},
					{
						name: 'Browser Task',
						value: 'browserTask',
						description: 'Run a natural-language browser automation task with a real AI-driven browser',
						action: 'Run an AI browser task',
					},
				],
				default: 'scrapeUrl',
				description: 'The operation to perform',
			},
			// Scrape URL operation fields
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['scrapeUrl'],
					},
				},
				default: '',
				placeholder: 'https://example.com',
				description: 'The URL of the website to scrape',
			},
			{
				displayName: 'Additional Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['scrapeUrl'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Max Wait Time (seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 300,
						description: 'Maximum time to wait for the scraping job to complete (default: 300 seconds)',
					},
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'Time between status checks (default: 3 seconds)',
					},
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: 'us',
						description: 'Country code for proxy routing (e.g., us, uk, de)',
					},
					{
						displayName: 'Force Fresh',
						name: 'forceFresh',
						type: 'boolean',
						default: false,
						description: 'Whether to bypass cache and force a fresh scrape',
					},
				],
			},
			// Search operation fields
			{
				displayName: 'Search Query',
				name: 'searchPrompt',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: '',
				placeholder: 'What are the latest trends in AI?',
				description: 'The search query or question to ask',
			},
			{
				displayName: 'Max Results',
				name: 'searchLimit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: 5,
				description: 'Maximum number of search results to return (default: 5)',
			},
			// Agentic Search operation fields
			{
				displayName: 'Search Prompt',
				name: 'agenticPrompt',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['agenticSearch'],
					},
				},
				default: '',
				placeholder: 'Find the pricing plans for top 5 CRM software',
				description: 'The search prompt for agentic analysis',
			},
			{
				displayName: 'Use Browser',
				name: 'useBrowser',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['agenticSearch'],
					},
				},
				default: true,
				description: 'Whether to use browser for scraping citations (more reliable but slower)',
			},
			{
				displayName: 'Additional Options',
				name: 'agenticOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['agenticSearch'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Max Wait Time (seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 600,
						description: 'Maximum time to wait for the agentic search to complete (default: 600 seconds)',
					},
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 5,
						description: 'Time between status checks (default: 5 seconds)',
					},
					{
						displayName: 'Data Schema (JSON)',
						name: 'dataSchema',
						type: 'json',
						default: '',
						description: 'Optional JSON schema describing the structured data to extract in addition to the research summary',
					},
				],
			},
			// Map operation fields
			{
				displayName: 'URL',
				name: 'mapUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['map'],
					},
				},
				default: '',
				placeholder: 'https://example.com',
				description: 'The starting URL for link discovery (typically a homepage or section root)',
			},
			{
				displayName: 'Additional Options',
				name: 'mapOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['map'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 100,
						description: 'Maximum number of URLs to return overall (default: 100)',
					},
					{
						displayName: 'Depth',
						name: 'depth',
						type: 'number',
						default: 2,
						description: 'How many link-hops from the starting URL to follow (default: 2)',
					},
					{
						displayName: 'Limit Per Level',
						name: 'limitPerLevel',
						type: 'number',
						default: 100,
						description: 'Maximum URLs collected per depth level, controls breadth (default: 100)',
					},
					{
						displayName: 'Include Subdomains',
						name: 'includeSubdomains',
						type: 'boolean',
						default: false,
						description: 'Whether to include URLs on subdomains of the starting host',
					},
					{
						displayName: 'Include External Links',
						name: 'includeExternalLinks',
						type: 'boolean',
						default: false,
						description: 'Whether to also collect (but not follow) external links',
					},
					{
						displayName: 'Use Browser',
						name: 'useBrowser',
						type: 'boolean',
						default: false,
						description: 'Whether to render with a headless browser (for SPAs)',
					},
					{
						displayName: 'Search Filter',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Optional keyword filter — only return URLs whose path/title matches',
					},
					{
						displayName: 'Max Wait Time (seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 300,
						description: 'Maximum time to wait for the mapping job to complete (default: 300 seconds)',
					},
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'Time between status checks (default: 3 seconds)',
					},
				],
			},
			// Crawl operation fields
			{
				displayName: 'URL',
				name: 'crawlUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['crawl'],
					},
				},
				default: '',
				placeholder: 'https://example.com',
				description: 'The starting URL to crawl',
			},
			{
				displayName: 'Additional Options',
				name: 'crawlOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['crawl'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Max Pages',
						name: 'maxPages',
						type: 'number',
						default: 10,
						description: 'Hard cap on pages fetched (default: 10)',
					},
					{
						displayName: 'Depth',
						name: 'depth',
						type: 'number',
						default: 1,
						description: 'Link-hops from the starting URL to follow (default: 1)',
					},
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: 'us',
						description: 'Two-letter proxy egress country code',
					},
					{
						displayName: 'Use Browser',
						name: 'useBrowser',
						type: 'boolean',
						default: false,
						description: 'Whether to render each page in a headless browser (for SPAs)',
					},
					{
						displayName: 'Include Patterns',
						name: 'includePatterns',
						type: 'string',
						default: '',
						description: 'Comma-separated glob/regex patterns. Only URLs matching at least one pattern are fetched.',
					},
					{
						displayName: 'Exclude Patterns',
						name: 'excludePatterns',
						type: 'string',
						default: '',
						description: 'Comma-separated glob/regex patterns. URLs matching any pattern are skipped.',
					},
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Optional saved-browser-session ID for login-protected sites',
					},
					{
						displayName: 'Session Name',
						name: 'sessionName',
						type: 'string',
						default: '',
						description: 'Optional saved-browser-session name',
					},
					{
						displayName: 'Max Wait Time (seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 300,
						description: 'Maximum time to wait for the crawl job to complete (default: 300 seconds)',
					},
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'Time between status checks (default: 3 seconds)',
					},
				],
			},
			// Wire Discover operation fields
			{
				displayName: 'Query',
				name: 'wireDiscoverQuery',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['wireDiscover'],
					},
				},
				default: '',
				placeholder: 'top phones on walmart',
				description: 'The intent in natural language, e.g. "top phones on walmart", "search airbnb listings in Lisbon"',
			},
			{
				displayName: 'Limit',
				name: 'wireDiscoverLimit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['wireDiscover'],
					},
				},
				default: 5,
				description: 'Maximum number of candidate actions to return (default: 5)',
			},
			// Wire Catalog operation fields
			{
				displayName: 'Catalog Slug',
				name: 'wireCatalogSlug',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['wireCatalog'],
					},
				},
				default: '',
				placeholder: 'walmart',
				description: 'Catalog slug to inspect (e.g. "walmart", "amazon", "linkedin"). Leave empty to list all catalogs.',
			},
			// Wire Read Action / Wire Write Action operation fields (same endpoint, same body
			// shape — split into two Operations only for read/write safety labeling)
			{
				displayName: 'Action ID',
				name: 'wireActionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['wireReadAction', 'wireWriteAction'],
					},
				},
				default: '',
				placeholder: 'walmart.search_products',
				description: 'The Wire action to run (from Wire: Discover Actions or Wire: Browse Catalog)',
			},
			{
				displayName: 'Params (JSON)',
				name: 'wireActionParams',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['wireReadAction', 'wireWriteAction'],
					},
				},
				default: '',
				description: 'The action\'s input parameters as JSON. Shape depends on the action — check its parameter schema via Wire: Discover Actions or Wire: Browse Catalog. Leave empty for actions that take none.',
			},
			{
				displayName: 'Credential ID',
				name: 'wireActionCredentialId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['wireReadAction', 'wireWriteAction'],
					},
				},
				default: '',
				description: 'Required when the action\'s auth_mode is "required"; honored when "optional". Get one from Wire: List Identities or Wire: Sign In.',
			},
			{
				displayName: 'Identity ID',
				name: 'wireActionIdentityId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['wireReadAction', 'wireWriteAction'],
					},
				},
				default: '',
				description: 'Optional identity selector — the server resolves a credential from it (alternative to Credential ID)',
			},
			{
				displayName: 'Additional Options',
				name: 'wireActionOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['wireReadAction', 'wireWriteAction'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Max Wait Time (seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 300,
						description: 'Maximum time to wait for the action to complete when it runs asynchronously (default: 300 seconds)',
					},
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'Default time between status checks; the API may suggest a different pacing which is honored when provided (default: 3 seconds)',
					},
				],
			},
			// Wire Identities operation fields
			{
				displayName: 'Catalog ID',
				name: 'wireIdentitiesCatalogId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['wireIdentities'],
					},
				},
				default: '',
				description: 'Optional — restrict to identities for a single catalog',
			},
			// Wire Login operation fields
			{
				displayName: 'Catalog Slug',
				name: 'wireLoginCatalogSlug',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['wireLogin'],
					},
				},
				default: '',
				placeholder: 'neb',
				description: 'The catalog to sign in to (e.g. "neb")',
			},
			{
				displayName: 'Login Params (JSON)',
				name: 'wireLoginParams',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['wireLogin'],
					},
				},
				default: '',
				description: 'Login fields defined by the catalog (e.g. { "email": "...", "password": "..." }). Use Wire: Browse Catalog\'s login_input_schema to learn the field names.',
			},
			{
				displayName: 'Identity Name',
				name: 'wireLoginIdentityName',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['wireLogin'],
					},
				},
				default: '',
				description: 'Optional name for the identity. Derived from params in password mode; required when using a 1Password locator.',
			},
			{
				displayName: 'Source ID',
				name: 'wireLoginSourceId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['wireLogin'],
					},
				},
				default: '',
				description: 'Optional 1Password identity-source ID (alternative to Login Params)',
			},
			{
				displayName: 'Source Ref (JSON)',
				name: 'wireLoginSourceRef',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['wireLogin'],
					},
				},
				default: '',
				description: 'Optional 1Password item locator { vault_id, item_id, fields } (use with Source ID instead of Login Params)',
			},
			// Wire Build Request operation fields
			{
				displayName: 'Website URL',
				name: 'wireBuildWebsiteUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['wireBuild'],
					},
				},
				default: '',
				placeholder: 'https://example.com',
				description: 'The site to build an action for. The domain is extracted automatically.',
			},
			{
				displayName: 'Goal',
				name: 'wireBuildGoal',
				type: 'string',
				required: true,
				typeOptions: {
					rows: 3,
				},
				displayOptions: {
					show: {
						operation: ['wireBuild'],
					},
				},
				default: '',
				placeholder: 'Extract product name, price, and availability from a product page',
				description: 'Natural-language description of what the action should do or extract. Be specific — the builder synthesizes the scraper from this.',
			},
			{
				displayName: 'Catalog ID',
				name: 'wireBuildCatalogId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['wireBuild'],
					},
				},
				default: '',
				description: 'Optional — attach to an existing catalog instead of creating one',
			},
			{
				displayName: 'Visibility',
				name: 'wireBuildVisibility',
				type: 'options',
				options: [
					{ name: 'Private', value: 'private' },
					{ name: 'Public', value: 'public' },
				],
				displayOptions: {
					show: {
						operation: ['wireBuild'],
					},
				},
				default: 'private',
				description: 'Action visibility (default: private)',
			},
			{
				displayName: 'Force',
				name: 'wireBuildForce',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['wireBuild'],
					},
				},
				default: false,
				description: 'Whether to build even if similar actions already exist for the domain (otherwise the request is rejected with ACTION_EXISTS)',
			},
			// Create Monitor operation fields
			{
				displayName: 'URL',
				name: 'monitorUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['monitorCreate'],
					},
				},
				default: '',
				placeholder: 'https://example.com/pricing',
				description: 'The URL to watch (root URL for site scope; the Wire site\'s URL for wire scope)',
			},
			{
				displayName: 'Interval (Minutes)',
				name: 'monitorIntervalMinutes',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['monitorCreate'],
					},
				},
				default: 60,
				description: 'Check frequency in minutes. Minimum 15.',
			},
			{
				displayName: 'Additional Options',
				name: 'monitorCreateOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['monitorCreate'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Scope',
						name: 'scope',
						type: 'options',
						options: [
							{ name: 'Page', value: 'page' },
							{ name: 'Site', value: 'site' },
							{ name: 'Wire', value: 'wire' },
						],
						default: 'page',
						description: 'What to monitor: one page (default), a whole site, or a Wire action',
					},
					{
						displayName: 'Watch Mode',
						name: 'watchMode',
						type: 'options',
						options: [
							{ name: 'Full Page', value: 'full_page' },
							{ name: 'Specific Data', value: 'specific_data' },
						],
						default: 'full_page',
						description: 'Compare the whole page (default) or only the fields in Output Schema, extracted with AI',
					},
					{
						displayName: 'Watch Format',
						name: 'watchFormat',
						type: 'options',
						options: [
							{ name: 'Markdown', value: 'markdown' },
							{ name: 'HTML', value: 'html' },
							{ name: 'Cleaned HTML', value: 'cleaned_html' },
						],
						default: 'markdown',
						description: 'Format compared in full_page mode',
					},
					{
						displayName: 'Output Schema (JSON)',
						name: 'outputSchema',
						type: 'json',
						default: '',
						description: 'JSON Schema of the fields to track. Required when Watch Mode is "Specific Data".',
					},
					{
						displayName: 'AI Mode',
						name: 'aiMode',
						type: 'boolean',
						default: false,
						description: 'Whether to filter out trivial noise (ads, timestamps) and summarize real changes with AI (+1 credit per check)',
					},
					{
						displayName: 'AI Goal',
						name: 'aiGoal',
						type: 'string',
						default: '',
						description: 'Natural-language description of which changes count as meaningful (used with AI Mode), e.g. "only when the price drops or it goes out of stock"',
					},
					{
						displayName: 'Use Browser',
						name: 'useBrowser',
						type: 'boolean',
						default: false,
						description: 'Whether to render checks with a stealth headless browser (needed for JS-heavy pages). Forced true when Session ID is set.',
					},
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: 'us',
						description: 'Two-letter proxy country code',
					},
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Saved browser-session ID for monitoring login-protected pages (see List Sessions)',
					},
					{
						displayName: 'Is Active',
						name: 'isActive',
						type: 'boolean',
						default: true,
						description: 'Whether to start running immediately',
					},
					{
						displayName: 'Expires At',
						name: 'expiresAt',
						type: 'string',
						default: '',
						description: 'Optional end date (ISO 8601 timestamp or YYYY-MM-DD); the monitor auto-pauses when it passes',
					},
					{
						displayName: 'Alert Webhook URL',
						name: 'alertWebhookUrl',
						type: 'string',
						default: '',
						description: 'Webhook URL that receives signed change alerts',
					},
					{
						displayName: 'Alert Emails',
						name: 'alertEmails',
						type: 'string',
						default: '',
						description: 'Comma-separated email recipients for change alerts',
					},
					{
						displayName: 'Max Pages',
						name: 'maxPages',
						type: 'number',
						default: 0,
						description: 'Site scope: max pages crawled per run (leave at 0 for the API default)',
					},
					{
						displayName: 'Max Depth',
						name: 'maxDepth',
						type: 'number',
						default: 0,
						description: 'Site scope: crawl depth 1-5, defaults to 2 (leave at 0 for the API default)',
					},
					{
						displayName: 'Include Patterns',
						name: 'includePatterns',
						type: 'string',
						default: '',
						description: 'Site scope: comma-separated glob patterns or hand-picked same-site URLs to track',
					},
					{
						displayName: 'Exclude Patterns',
						name: 'excludePatterns',
						type: 'string',
						default: '',
						description: 'Site scope: comma-separated glob patterns to skip',
					},
					{
						displayName: 'Wire Action ID',
						name: 'wireActionId',
						type: 'string',
						default: '',
						description: 'Wire scope (required there): the Wire action run each check, e.g. "amazon.search_products" (see Wire: Discover Actions)',
					},
					{
						displayName: 'Wire Catalog Slug',
						name: 'wireCatalogSlug',
						type: 'string',
						default: '',
						description: 'Wire scope: catalog slug of the Wire site',
					},
					{
						displayName: 'Wire Credential ID',
						name: 'wireCredentialId',
						type: 'string',
						default: '',
						description: 'Wire scope: credential ID when the action needs auth (see Wire: List Identities)',
					},
					{
						displayName: 'Wire Params (JSON)',
						name: 'wireParams',
						type: 'json',
						default: '',
						description: 'Wire scope: parameters passed to the action each check',
					},
					{
						displayName: 'Wire Watch Paths',
						name: 'wireWatchPaths',
						type: 'string',
						default: '',
						description: 'Wire scope: comma-separated JSON paths to diff instead of the whole response',
					},
				],
			},
			// List Monitors operation fields
			{
				displayName: 'Monitor ID',
				name: 'monitorListId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['monitorList'],
					},
				},
				default: '',
				description: 'Optional — fetch just this monitor instead of the full list',
			},
			// Get Monitor Changes operation fields
			{
				displayName: 'Monitor ID',
				name: 'monitorChangesId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['monitorChanges'],
					},
				},
				default: '',
				description: 'The monitor ID (from List Monitors or Create Monitor)',
			},
			// Control Monitor operation fields
			{
				displayName: 'Monitor ID',
				name: 'monitorControlId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['monitorControl'],
					},
				},
				default: '',
				description: 'The monitor ID (from List Monitors or Create Monitor)',
			},
			{
				displayName: 'Action',
				name: 'monitorControlAction',
				type: 'options',
				required: true,
				options: [
					{ name: 'Pause', value: 'pause', description: 'Stop scheduled checks' },
					{ name: 'Resume', value: 'resume', description: 'Restart scheduled checks (may hit the plan\'s active-monitor cap)' },
					{ name: 'Run Now', value: 'run_now', description: 'Trigger an immediate out-of-schedule check (billed like a normal check)' },
					{ name: 'Delete', value: 'delete', description: 'Permanently remove the monitor and its history' },
				],
				displayOptions: {
					show: {
						operation: ['monitorControl'],
					},
				},
				default: 'pause',
				description: 'What to do with the monitor',
			},
			// AI Visibility Search operation fields
			{
				displayName: 'Query',
				name: 'aiVisibilityQuery',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['aiVisibilitySearch'],
					},
				},
				default: '',
				placeholder: 'What is the best CRM software for small businesses?',
				description: 'The question to ask every AI engine (max 2000 characters)',
			},
			{
				displayName: 'Additional Options',
				name: 'aiVisibilitySearchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['aiVisibilitySearch'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Sources',
						name: 'sources',
						type: 'string',
						default: '',
						description: 'Comma-separated engine slugs to query (see AI Visibility Sources). Leave empty to query all enabled engines.',
					},
					{
						displayName: 'Country Code',
						name: 'country',
						type: 'string',
						default: 'us',
						description: 'Two-letter ISO country for the search geography (proxy exit)',
					},
					{
						displayName: 'Include Full Content',
						name: 'includeFullContent',
						type: 'boolean',
						default: false,
						description: 'Whether to include each engine\'s raw full answer in the results (large). Summaries and the synthesis are returned regardless.',
					},
					{
						displayName: 'Max Wait Time (seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 180,
						description: 'Maximum time to wait for the search to complete (default: 180 seconds)',
					},
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'Time between status checks (default: 3 seconds)',
					},
				],
			},
			// Session List operation fields
			{
				displayName: 'Domain',
				name: 'sessionListDomain',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sessionList'],
					},
				},
				default: '',
				placeholder: 'amazon.com',
				description: 'Optional — filter to sessions for one website domain',
			},
			// Session Delete operation fields
			{
				displayName: 'Session ID',
				name: 'sessionDeleteId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sessionDelete'],
					},
				},
				default: '',
				description: 'The session ID to delete (from List Sessions)',
			},
			// Browser Task operation fields
			{
				displayName: 'Prompt',
				name: 'browserTaskPrompt',
				type: 'string',
				required: true,
				typeOptions: {
					rows: 3,
				},
				displayOptions: {
					show: {
						operation: ['browserTask'],
					},
				},
				default: '',
				placeholder: 'Find the cheapest 65-inch TV on this site and list its specs',
				description: 'The task in natural language. Be specific about the goal and what to return. Never include passwords or secrets — use Session ID for authenticated sites.',
			},
			{
				displayName: 'Additional Options',
				name: 'browserTaskOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						operation: ['browserTask'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'Navigate here before starting. Leave empty to let the agent follow URLs named in the prompt.',
					},
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Saved browser-session ID (from List Sessions) so the task runs logged in',
					},
					{
						displayName: 'Max Steps',
						name: 'maxSteps',
						type: 'number',
						default: 0,
						description: 'Cap on agent steps (navigation/click/type actions). Leave at 0 for the API default.',
					},
					{
						displayName: 'Timeout (Ms)',
						name: 'timeoutMs',
						type: 'number',
						default: 0,
						description: 'Task timeout in milliseconds; server caps runs at ~330s regardless. Leave at 0 for the API default.',
					},
					{
						displayName: 'Output Schema (JSON)',
						name: 'outputSchema',
						type: 'json',
						default: '',
						description: 'JSON Schema for the result — the agent returns structured data conforming to it',
					},
					{
						displayName: 'Max Wait Time (seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 360,
						description: 'Maximum time to wait for the browser task to complete (default: 360 seconds / 6 minutes)',
					},
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'Time between status checks (default: 3 seconds)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('anakinScraperApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'scrapeUrl') {
					const result = await (AnakinScraper.prototype.executeScrapeUrl as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'search') {
					const result = await (AnakinScraper.prototype.executeSearch as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'agenticSearch') {
					const result = await (AnakinScraper.prototype.executeAgenticSearch as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'map') {
					const result = await (AnakinScraper.prototype.executeMap as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'crawl') {
					const result = await (AnakinScraper.prototype.executeCrawl as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'wireDiscover') {
					const result = await (AnakinScraper.prototype.executeWireDiscover as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'wireCatalog') {
					const result = await (AnakinScraper.prototype.executeWireCatalog as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'wireReadAction' || operation === 'wireWriteAction') {
					const result = await (AnakinScraper.prototype.executeWireAction as any).call(this, i, credentials, operation);
					returnData.push(result);
				} else if (operation === 'wireIdentities') {
					const result = await (AnakinScraper.prototype.executeWireIdentities as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'wireLogin') {
					const result = await (AnakinScraper.prototype.executeWireLogin as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'wireBuild') {
					const result = await (AnakinScraper.prototype.executeWireBuild as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'monitorCreate') {
					const result = await (AnakinScraper.prototype.executeMonitorCreate as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'monitorList') {
					const result = await (AnakinScraper.prototype.executeMonitorList as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'monitorChanges') {
					const result = await (AnakinScraper.prototype.executeMonitorChanges as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'monitorControl') {
					const result = await (AnakinScraper.prototype.executeMonitorControl as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'aiVisibilitySearch') {
					const result = await (AnakinScraper.prototype.executeAiVisibilitySearch as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'aiVisibilitySources') {
					const result = await (AnakinScraper.prototype.executeAiVisibilitySources as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'sessionList') {
					const result = await (AnakinScraper.prototype.executeSessionList as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'sessionDelete') {
					const result = await (AnakinScraper.prototype.executeSessionDelete as any).call(this, i, credentials);
					returnData.push(result);
				} else if (operation === 'browserTask') {
					const result = await (AnakinScraper.prototype.executeBrowserTask as any).call(this, i, credentials);
					returnData.push(result);
				}

			} catch (error) {
				// Handle errors
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({
						json: {
							success: false,
							error: errorMessage,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	// Execute Scrape URL operation
	async executeScrapeUrl(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		// Get user inputs
		const url = this.getNodeParameter('url', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as any;

		// Extract options with defaults
		const maxWaitTime = (options.maxWaitTime || 300) * 1000; // Convert to milliseconds
		const pollInterval = (options.pollInterval || 3) * 1000; // Convert to milliseconds
		const country = options.country || 'us';
		const forceFresh = options.forceFresh || false;

		// Validate URL
		if (!url || url.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'URL is required',
				{ itemIndex },
			);
		}

		// Step 1: Submit the scraping job
		const submitResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/request`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: {
					job_type: 'url_scraper',
					url: url.trim(),
					country,
					force_fresh: forceFresh,
				},
				json: true,
			},
		);

		// Extract request ID from response
		const requestId = (submitResponse as any).jobId || (submitResponse as any).jobId;

		if (!requestId) {
			throw new NodeOperationError(
				this.getNode(),
				'No request ID received from API',
				{ itemIndex },
			);
		}

		// Step 2: Poll for completion
		const startTime = Date.now();
		let attempts = 0;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;

			// Wait before checking status (except first attempt)
			if (attempts > 1) {
				await sleep(pollInterval);
			}

			// Check the status
			const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'anakinScraperApi',
				{
					method: 'GET',
					url: `${credentials.baseUrl}/v1/request/${requestId}`,
					headers: {
						'Accept': 'application/json',
					},
					json: true,
				},
			);

			const status = (statusResponse as any).status;

			// Check if job is completed
			if (status === 'completed' || status === 'success') {
				return {
					json: {
						success: true,
						operation: 'scrapeUrl',
						request_id: requestId,
						url,
						...statusResponse as any,
					},
					pairedItem: { item: itemIndex },
				};
			}

			// Check if job failed
			if (status === 'failed' || status === 'error') {
				const errorMessage = (statusResponse as any).error ||
									(statusResponse as any).error_message ||
									'Unknown error occurred';

				throw new NodeOperationError(
					this.getNode(),
					`Scraping job failed: ${errorMessage}`,
					{ itemIndex },
				);
			}

			// Check if we've exceeded max wait time
			if (Date.now() - startTime >= maxWaitTime) {
				throw new NodeOperationError(
					this.getNode(),
					`Job did not complete within ${maxWaitTime / 1000} seconds. Last status: ${status}`,
					{ itemIndex },
				);
			}

			// Job is still processing (status: 'pending', 'processing', 'queued', etc.)
		}

		throw new NodeOperationError(
			this.getNode(),
			`Job timed out after ${maxWaitTime / 1000} seconds`,
			{ itemIndex },
		);
	}

	// Execute Search operation
	async executeSearch(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		// Get user inputs
		const prompt = this.getNodeParameter('searchPrompt', itemIndex) as string;
		const limit = this.getNodeParameter('searchLimit', itemIndex, 5) as number;

		// Validate prompt
		if (!prompt || prompt.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Search query is required',
				{ itemIndex },
			);
		}

		// Call the search API (synchronous)
		const searchResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/search`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: {
					prompt: prompt.trim(),
					limit: limit || 5,
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'search',
				query: prompt,
				...searchResponse as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Agentic Search operation
	async executeAgenticSearch(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		// Get user inputs
		const prompt = this.getNodeParameter('agenticPrompt', itemIndex) as string;
		const useBrowser = this.getNodeParameter('useBrowser', itemIndex, true) as boolean;
		const options = this.getNodeParameter('agenticOptions', itemIndex, {}) as any;

		// Extract options with defaults
		const maxWaitTime = (options.maxWaitTime || 600) * 1000; // Convert to milliseconds
		const pollInterval = (options.pollInterval || 5) * 1000; // Convert to milliseconds

		// Validate prompt
		if (!prompt || prompt.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Search prompt is required',
				{ itemIndex },
			);
		}

		// Parse the optional data schema
		let dataSchema: object | undefined;
		const dataSchemaRaw = options.dataSchema;
		if (dataSchemaRaw && typeof dataSchemaRaw === 'string' && dataSchemaRaw.trim() !== '') {
			try {
				dataSchema = JSON.parse(dataSchemaRaw);
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'Data Schema must be valid JSON',
					{ itemIndex },
				);
			}
		} else if (dataSchemaRaw && typeof dataSchemaRaw === 'object') {
			dataSchema = dataSchemaRaw;
		}

		// Step 1: Submit the agentic search job
		const submitResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/agentic-search`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: {
					prompt: prompt.trim(),
					useBrowser: useBrowser,
					...(dataSchema ? { schema: dataSchema } : {}),
				},
				json: true,
			},
		);

		// Extract job ID from response
		const jobId = (submitResponse as any).job_id || (submitResponse as any).jobId;

		if (!jobId) {
			throw new NodeOperationError(
				this.getNode(),
				'No job ID received from API',
				{ itemIndex },
			);
		}

		// Step 2: Poll for completion
		const startTime = Date.now();
		let attempts = 0;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;

			// Wait before checking status (except first attempt)
			if (attempts > 1) {
				await sleep(pollInterval);
			}

			// Check the status
			const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'anakinScraperApi',
				{
					method: 'GET',
					url: `${credentials.baseUrl}/v1/agentic-search/${jobId}`,
					headers: {
						'Accept': 'application/json',
					},
					json: true,
				},
			);

			const status = (statusResponse as any).status;

			// Check if job is completed
			if (status === 'completed') {
				return {
					json: {
						success: true,
						operation: 'agenticSearch',
						job_id: jobId,
						prompt,
						...statusResponse as any,
					},
					pairedItem: { item: itemIndex },
				};
			}

			// Check if job failed
			if (status === 'failed' || status === 'error') {
				const errorMessage = (statusResponse as any).message ||
									(statusResponse as any).error ||
									'Unknown error occurred';

				throw new NodeOperationError(
					this.getNode(),
					`Agentic search failed: ${errorMessage}`,
					{ itemIndex },
				);
			}

			// Check if we've exceeded max wait time
			if (Date.now() - startTime >= maxWaitTime) {
				throw new NodeOperationError(
					this.getNode(),
					`Agentic search did not complete within ${maxWaitTime / 1000} seconds. Last status: ${status}`,
					{ itemIndex },
				);
			}

			// Job is still processing (status: 'pending', 'processing', etc.)
		}

		throw new NodeOperationError(
			this.getNode(),
			`Agentic search timed out after ${maxWaitTime / 1000} seconds`,
			{ itemIndex },
		);
	}

	// Execute Map operation
	async executeMap(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const url = this.getNodeParameter('mapUrl', itemIndex) as string;
		const options = this.getNodeParameter('mapOptions', itemIndex, {}) as any;

		const maxWaitTime = (options.maxWaitTime || 300) * 1000;
		const pollInterval = (options.pollInterval || 3) * 1000;

		if (!url || url.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'URL is required',
				{ itemIndex },
			);
		}

		const body: Record<string, unknown> = {
			url: url.trim(),
			limit: options.limit || 100,
			depth: options.depth || 2,
			limitPerLevel: options.limitPerLevel || 100,
			includeSubdomains: options.includeSubdomains || false,
			includeExternalLinks: options.includeExternalLinks || false,
			useBrowser: options.useBrowser || false,
		};
		if (options.search) {
			body.search = options.search;
		}

		const submitResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/map`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		const jobId = (submitResponse as any).jobId;

		if (!jobId) {
			throw new NodeOperationError(
				this.getNode(),
				'No job ID received from API',
				{ itemIndex },
			);
		}

		const startTime = Date.now();
		let attempts = 0;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;

			if (attempts > 1) {
				await sleep(pollInterval);
			}

			const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'anakinScraperApi',
				{
					method: 'GET',
					url: `${credentials.baseUrl}/v1/map/${jobId}`,
					headers: {
						'Accept': 'application/json',
					},
					json: true,
				},
			);

			const status = (statusResponse as any).status;

			if (status === 'completed' || status === 'success') {
				return {
					json: {
						success: true,
						operation: 'map',
						job_id: jobId,
						url,
						...statusResponse as any,
					},
					pairedItem: { item: itemIndex },
				};
			}

			if (status === 'failed' || status === 'error') {
				const errorMessage = (statusResponse as any).error || 'Unknown error occurred';
				throw new NodeOperationError(
					this.getNode(),
					`Map job failed: ${errorMessage}`,
					{ itemIndex },
				);
			}

			if (Date.now() - startTime >= maxWaitTime) {
				throw new NodeOperationError(
					this.getNode(),
					`Job did not complete within ${maxWaitTime / 1000} seconds. Last status: ${status}`,
					{ itemIndex },
				);
			}
		}

		throw new NodeOperationError(
			this.getNode(),
			`Map job timed out after ${maxWaitTime / 1000} seconds`,
			{ itemIndex },
		);
	}

	// Execute Crawl operation
	async executeCrawl(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const url = this.getNodeParameter('crawlUrl', itemIndex) as string;
		const options = this.getNodeParameter('crawlOptions', itemIndex, {}) as any;

		const maxWaitTime = (options.maxWaitTime || 300) * 1000;
		const pollInterval = (options.pollInterval || 3) * 1000;

		if (!url || url.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'URL is required',
				{ itemIndex },
			);
		}

		const includePatterns = parseListField(options.includePatterns);
		const excludePatterns = parseListField(options.excludePatterns);

		const body: Record<string, unknown> = {
			url: url.trim(),
			maxPages: options.maxPages || 10,
			depth: options.depth || 1,
			country: options.country || 'us',
			useBrowser: options.useBrowser || false,
		};
		if (includePatterns) {
			body.includePatterns = includePatterns;
		}
		if (excludePatterns) {
			body.excludePatterns = excludePatterns;
		}
		if (options.sessionId) {
			body.sessionId = options.sessionId;
		}
		if (options.sessionName) {
			body.sessionName = options.sessionName;
		}

		const submitResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/crawl`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		const jobId = (submitResponse as any).jobId;

		if (!jobId) {
			throw new NodeOperationError(
				this.getNode(),
				'No job ID received from API',
				{ itemIndex },
			);
		}

		const startTime = Date.now();
		let attempts = 0;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;

			if (attempts > 1) {
				await sleep(pollInterval);
			}

			const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'anakinScraperApi',
				{
					method: 'GET',
					url: `${credentials.baseUrl}/v1/crawl/${jobId}`,
					headers: {
						'Accept': 'application/json',
					},
					json: true,
				},
			);

			const status = (statusResponse as any).status;

			if (status === 'completed' || status === 'success') {
				return {
					json: {
						success: true,
						operation: 'crawl',
						job_id: jobId,
						url,
						...statusResponse as any,
					},
					pairedItem: { item: itemIndex },
				};
			}

			if (status === 'failed' || status === 'error') {
				const errorMessage = (statusResponse as any).error || 'Unknown error occurred';
				throw new NodeOperationError(
					this.getNode(),
					`Crawl job failed: ${errorMessage}`,
					{ itemIndex },
				);
			}

			if (Date.now() - startTime >= maxWaitTime) {
				throw new NodeOperationError(
					this.getNode(),
					`Job did not complete within ${maxWaitTime / 1000} seconds. Last status: ${status}`,
					{ itemIndex },
				);
			}
		}

		throw new NodeOperationError(
			this.getNode(),
			`Crawl job timed out after ${maxWaitTime / 1000} seconds`,
			{ itemIndex },
		);
	}

	// Execute Wire Discover operation
	async executeWireDiscover(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const q = this.getNodeParameter('wireDiscoverQuery', itemIndex) as string;
		const limit = this.getNodeParameter('wireDiscoverLimit', itemIndex, 5) as number;

		if (!q || q.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Query is required',
				{ itemIndex },
			);
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'GET',
				url: `${credentials.baseUrl}/v1/wire/resolve`,
				qs: {
					q: q.trim(),
					limit: limit || 5,
				},
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'wireDiscover',
				query: q,
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Wire Catalog operation
	async executeWireCatalog(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const slug = (this.getNodeParameter('wireCatalogSlug', itemIndex, '') as string).trim();

		const url = slug
			? `${credentials.baseUrl}/v1/wire/catalog/${encodeURIComponent(slug)}`
			: `${credentials.baseUrl}/v1/wire/catalog`;

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'GET',
				url,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'wireCatalog',
				...(slug ? { slug } : {}),
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Wire Read Action / Wire Write Action operation. Both hit the identical
	// POST /wire/task endpoint with the same body shape — split into two n8n Operations
	// only for read/write safety labeling (mirrors Anakin's own MCP server, which shares
	// one runWireAction implementation between its wire_read_action and wire_write_action
	// tools).
	async executeWireAction(this: IExecuteFunctions, itemIndex: number, credentials: any, operation: string): Promise<INodeExecutionData> {
		const actionId = this.getNodeParameter('wireActionId', itemIndex) as string;
		const paramsRaw = this.getNodeParameter('wireActionParams', itemIndex, '') as string;
		const credentialId = (this.getNodeParameter('wireActionCredentialId', itemIndex, '') as string).trim();
		const identityId = (this.getNodeParameter('wireActionIdentityId', itemIndex, '') as string).trim();
		const options = this.getNodeParameter('wireActionOptions', itemIndex, {}) as any;

		const maxWaitTime = (options.maxWaitTime || 300) * 1000;
		const pollInterval = (options.pollInterval || 3) * 1000;

		if (!actionId || actionId.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Action ID is required',
				{ itemIndex },
			);
		}

		const params = parseJsonField(this, itemIndex, paramsRaw, 'Params');

		const body: Record<string, unknown> = { action_id: actionId.trim() };
		if (params && typeof params === 'object' && Object.keys(params).length > 0) {
			body.params = params;
		}
		if (credentialId) {
			body.credential_id = credentialId;
		}
		if (identityId) {
			body.identity_id = identityId;
		}

		const submitResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/wire/task`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		const jobId = (submitResponse as any).job_id;

		// Sync action: terminal data came back inline, nothing to poll.
		if (!jobId) {
			return {
				json: {
					success: true,
					operation,
					action_id: actionId,
					...submitResponse as any,
				},
				pairedItem: { item: itemIndex },
			};
		}

		const startTime = Date.now();
		let attempts = 0;
		let waitMs = pollInterval;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;

			if (attempts > 1) {
				await sleep(waitMs);
			}

			const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'anakinScraperApi',
				{
					method: 'GET',
					url: `${credentials.baseUrl}/v1/wire/jobs/${jobId}`,
					headers: {
						'Accept': 'application/json',
					},
					json: true,
				},
			);

			const status = (statusResponse as any).status;

			if (status === 'completed') {
				return {
					json: {
						success: true,
						operation,
						action_id: actionId,
						job_id: jobId,
						...statusResponse as any,
					},
					pairedItem: { item: itemIndex },
				};
			}

			if (status === 'failed') {
				const errorInfo = (statusResponse as any).error || {};
				const errorMessage = errorInfo.message || errorInfo.code || 'Unknown error occurred';
				throw new NodeOperationError(
					this.getNode(),
					`Wire job failed: ${errorMessage}`,
					{ itemIndex },
				);
			}

			if (Date.now() - startTime >= maxWaitTime) {
				throw new NodeOperationError(
					this.getNode(),
					`Wire job did not complete within ${maxWaitTime / 1000} seconds. Last status: ${status}`,
					{ itemIndex },
				);
			}

			// Respect the server's suggested pacing when present, clamped to a sane range.
			const retryAfterMs = (statusResponse as any).retry_after_ms;
			waitMs = typeof retryAfterMs === 'number' ? clampNumber(retryAfterMs, 500, 10000) : pollInterval;
		}

		throw new NodeOperationError(
			this.getNode(),
			`Wire job timed out after ${maxWaitTime / 1000} seconds`,
			{ itemIndex },
		);
	}

	// Execute Wire Identities operation
	async executeWireIdentities(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const catalogId = (this.getNodeParameter('wireIdentitiesCatalogId', itemIndex, '') as string).trim();

		const qs: Record<string, string> = {};
		if (catalogId) {
			qs.catalog_id = catalogId;
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'GET',
				url: `${credentials.baseUrl}/v1/wire/identities`,
				qs,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'wireIdentities',
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Wire Login operation
	async executeWireLogin(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const catalogSlug = this.getNodeParameter('wireLoginCatalogSlug', itemIndex) as string;
		const paramsRaw = this.getNodeParameter('wireLoginParams', itemIndex, '') as string;
		const identityName = (this.getNodeParameter('wireLoginIdentityName', itemIndex, '') as string).trim();
		const sourceId = (this.getNodeParameter('wireLoginSourceId', itemIndex, '') as string).trim();
		const sourceRefRaw = this.getNodeParameter('wireLoginSourceRef', itemIndex, '') as string;

		if (!catalogSlug || catalogSlug.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Catalog Slug is required',
				{ itemIndex },
			);
		}

		const params = parseJsonField(this, itemIndex, paramsRaw, 'Login Params');
		const sourceRef = parseJsonField(this, itemIndex, sourceRefRaw, 'Source Ref');

		const body: Record<string, unknown> = { catalog_slug: catalogSlug.trim() };
		if (params && typeof params === 'object') {
			body.params = params;
		}
		if (identityName) {
			body.identity_name = identityName;
		}
		if (sourceId) {
			body.source_id = sourceId;
		}
		if (sourceRef && typeof sourceRef === 'object') {
			body.source_ref = sourceRef;
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/wire/login`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'wireLogin',
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Wire Build Request operation
	async executeWireBuild(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const websiteUrl = this.getNodeParameter('wireBuildWebsiteUrl', itemIndex) as string;
		const goal = this.getNodeParameter('wireBuildGoal', itemIndex) as string;
		const catalogId = (this.getNodeParameter('wireBuildCatalogId', itemIndex, '') as string).trim();
		const visibility = this.getNodeParameter('wireBuildVisibility', itemIndex, 'private') as string;
		const force = this.getNodeParameter('wireBuildForce', itemIndex, false) as boolean;

		if (!websiteUrl || websiteUrl.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Website URL is required',
				{ itemIndex },
			);
		}
		if (!goal || goal.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Goal is required',
				{ itemIndex },
			);
		}

		const body: Record<string, unknown> = {
			website_url: websiteUrl.trim(),
			goal: goal.trim(),
			visibility,
			force,
		};
		if (catalogId) {
			body.catalog_id = catalogId;
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/wire/build-request`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'wireBuild',
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Create Monitor operation
	async executeMonitorCreate(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const url = this.getNodeParameter('monitorUrl', itemIndex) as string;
		const intervalMinutes = this.getNodeParameter('monitorIntervalMinutes', itemIndex) as number;
		const options = this.getNodeParameter('monitorCreateOptions', itemIndex, {}) as any;

		if (!url || url.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'URL is required',
				{ itemIndex },
			);
		}
		if (!intervalMinutes || intervalMinutes < 15) {
			throw new NodeOperationError(
				this.getNode(),
				'Interval (Minutes) must be at least 15',
				{ itemIndex },
			);
		}

		const outputSchema = parseJsonField(this, itemIndex, options.outputSchema, 'Output Schema');
		const wireParams = parseJsonField(this, itemIndex, options.wireParams, 'Wire Params');
		const includePatterns = parseListField(options.includePatterns);
		const excludePatterns = parseListField(options.excludePatterns);
		const wireWatchPaths = parseListField(options.wireWatchPaths);

		const body: Record<string, unknown> = {
			url: url.trim(),
			intervalMinutes,
		};

		if (options.scope) body.scope = options.scope;
		if (options.watchMode) body.watchMode = options.watchMode;
		if (options.watchFormat) body.watchFormat = options.watchFormat;
		if (outputSchema !== undefined) body.outputSchema = outputSchema;
		if (options.aiMode !== undefined) body.aiMode = options.aiMode;
		if (options.aiGoal) body.aiGoal = options.aiGoal;
		if (options.useBrowser !== undefined) body.useBrowser = options.useBrowser;
		if (options.country) body.country = options.country;
		if (options.sessionId) body.sessionId = options.sessionId;
		if (options.isActive !== undefined) body.isActive = options.isActive;
		if (options.expiresAt) body.expiresAt = options.expiresAt;
		if (options.alertWebhookUrl) body.alertWebhookUrl = options.alertWebhookUrl;
		if (options.alertEmails) body.alertEmails = options.alertEmails;
		if (options.maxPages) body.maxPages = options.maxPages;
		if (options.maxDepth) body.maxDepth = options.maxDepth;
		if (includePatterns) body.includePatterns = includePatterns;
		if (excludePatterns) body.excludePatterns = excludePatterns;
		if (options.wireActionId) body.wireActionId = options.wireActionId;
		if (options.wireCatalogSlug) body.wireCatalogSlug = options.wireCatalogSlug;
		if (options.wireCredentialId) body.wireCredentialId = options.wireCredentialId;
		if (wireParams !== undefined) body.wireParams = wireParams;
		if (wireWatchPaths) body.wireWatchPaths = wireWatchPaths;

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/monitors`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'monitorCreate',
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute List Monitors operation
	async executeMonitorList(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const id = (this.getNodeParameter('monitorListId', itemIndex, '') as string).trim();

		const url = id
			? `${credentials.baseUrl}/v1/monitors/${encodeURIComponent(id)}`
			: `${credentials.baseUrl}/v1/monitors`;

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'GET',
				url,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'monitorList',
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Get Monitor Changes operation
	async executeMonitorChanges(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const id = this.getNodeParameter('monitorChangesId', itemIndex) as string;

		if (!id || id.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Monitor ID is required',
				{ itemIndex },
			);
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'GET',
				url: `${credentials.baseUrl}/v1/monitors/${encodeURIComponent(id.trim())}/changes`,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'monitorChanges',
				monitor_id: id,
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Control Monitor operation
	async executeMonitorControl(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const id = this.getNodeParameter('monitorControlId', itemIndex) as string;
		const action = this.getNodeParameter('monitorControlAction', itemIndex) as string;

		if (!id || id.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Monitor ID is required',
				{ itemIndex },
			);
		}

		const base = `${credentials.baseUrl}/v1/monitors/${encodeURIComponent(id.trim())}`;
		let method: 'POST' | 'DELETE';
		let url: string;

		switch (action) {
			case 'pause':
				method = 'POST';
				url = `${base}/pause`;
				break;
			case 'resume':
				method = 'POST';
				url = `${base}/resume`;
				break;
			case 'run_now':
				method = 'POST';
				url = `${base}/run`;
				break;
			case 'delete':
				method = 'DELETE';
				url = base;
				break;
			default:
				throw new NodeOperationError(
					this.getNode(),
					`Unknown monitor action "${action}"`,
					{ itemIndex },
				);
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method,
				url,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'monitorControl',
				monitor_id: id,
				action,
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute AI Visibility Search operation
	async executeAiVisibilitySearch(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const query = this.getNodeParameter('aiVisibilityQuery', itemIndex) as string;
		const options = this.getNodeParameter('aiVisibilitySearchOptions', itemIndex, {}) as any;

		const maxWaitTime = (options.maxWaitTime || 180) * 1000;
		const pollInterval = (options.pollInterval || 3) * 1000;
		const includeFullContent = options.includeFullContent || false;
		const sources = parseListField(options.sources);

		if (!query || query.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Query is required',
				{ itemIndex },
			);
		}

		const body: Record<string, unknown> = { query: query.trim() };
		if (sources) {
			body.sources = sources;
		}
		if (options.country) {
			body.country = options.country;
		}

		const submitResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/ai-visibility/search`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		const searchId = (submitResponse as any).search_id;

		if (!searchId) {
			throw new NodeOperationError(
				this.getNode(),
				'No search ID received from API',
				{ itemIndex },
			);
		}

		const startTime = Date.now();
		let attempts = 0;
		let finalResponse: any = submitResponse;

		// A 'failed' status is still returned with per-source data/errors, not thrown —
		// the loop below simply stops polling once status is no longer 'running'.
		while (Date.now() - startTime < maxWaitTime) {
			attempts++;

			if (attempts > 1) {
				await sleep(pollInterval);
			}

			const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'anakinScraperApi',
				{
					method: 'GET',
					url: `${credentials.baseUrl}/v1/ai-visibility/search/${encodeURIComponent(searchId)}`,
					headers: {
						'Accept': 'application/json',
					},
					json: true,
				},
			);

			finalResponse = statusResponse;
			const status = (statusResponse as any).status;

			if (status !== 'running') {
				break;
			}

			if (Date.now() - startTime >= maxWaitTime) {
				throw new NodeOperationError(
					this.getNode(),
					`AI Visibility search did not complete within ${maxWaitTime / 1000} seconds. It may still be running — check search_id ${searchId} later.`,
					{ itemIndex },
				);
			}
		}

		const rawResults = (finalResponse as any).results;
		const results = Array.isArray(rawResults)
			? rawResults.map((result: Record<string, unknown>) => {
					if (includeFullContent) {
						return result;
					}
					const { full_content: _fullContent, ...rest } = result;
					return rest;
				})
			: rawResults;

		return {
			json: {
				success: true,
				operation: 'aiVisibilitySearch',
				query,
				...finalResponse as any,
				results,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute AI Visibility Sources operation
	async executeAiVisibilitySources(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'GET',
				url: `${credentials.baseUrl}/v1/ai-visibility/sources`,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'aiVisibilitySources',
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute List Sessions operation
	async executeSessionList(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const domain = (this.getNodeParameter('sessionListDomain', itemIndex, '') as string).trim();

		const qs: Record<string, string> = {};
		if (domain) {
			qs.domain = domain;
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'GET',
				url: `${credentials.baseUrl}/v1/sessions`,
				qs,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'sessionList',
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Delete Session operation
	async executeSessionDelete(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const id = this.getNodeParameter('sessionDeleteId', itemIndex) as string;

		if (!id || id.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Session ID is required',
				{ itemIndex },
			);
		}

		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'DELETE',
				url: `${credentials.baseUrl}/v1/sessions/${encodeURIComponent(id.trim())}`,
				headers: {
					'Accept': 'application/json',
				},
				json: true,
			},
		);

		return {
			json: {
				success: true,
				operation: 'sessionDelete',
				session_id: id,
				...response as any,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Execute Browser Task operation
	async executeBrowserTask(this: IExecuteFunctions, itemIndex: number, credentials: any): Promise<INodeExecutionData> {
		const prompt = this.getNodeParameter('browserTaskPrompt', itemIndex) as string;
		const options = this.getNodeParameter('browserTaskOptions', itemIndex, {}) as any;

		const maxWaitTime = (options.maxWaitTime || 360) * 1000;
		const pollInterval = (options.pollInterval || 3) * 1000;

		if (!prompt || prompt.trim() === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Prompt is required',
				{ itemIndex },
			);
		}

		const outputSchema = parseJsonField(this, itemIndex, options.outputSchema, 'Output Schema');

		const body: Record<string, unknown> = {
			prompt: prompt.trim(),
			async: true,
		};
		if (options.url) {
			body.url = options.url;
		}
		if (options.sessionId) {
			body.session_id = options.sessionId;
		}
		if (options.maxSteps) {
			body.max_steps = options.maxSteps;
		}
		if (options.timeoutMs) {
			body.timeout_ms = options.timeoutMs;
		}
		if (outputSchema !== undefined) {
			body.output_schema = outputSchema;
		}

		const submitResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'anakinScraperApi',
			{
				method: 'POST',
				url: `${credentials.baseUrl}/v1/ai/evaluate`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body,
				json: true,
			},
		);

		const workflowId = (submitResponse as any).workflow_id;

		// Service answered synchronously (shouldn't happen with async: true).
		if (!workflowId) {
			return {
				json: {
					success: true,
					operation: 'browserTask',
					...submitResponse as any,
				},
				pairedItem: { item: itemIndex },
			};
		}

		const startTime = Date.now();
		let attempts = 0;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;

			if (attempts > 1) {
				await sleep(pollInterval);
			}

			const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'anakinScraperApi',
				{
					method: 'GET',
					url: `${credentials.baseUrl}/v1/ai/jobs/${encodeURIComponent(workflowId)}`,
					headers: {
						'Accept': 'application/json',
					},
					json: true,
				},
			);

			const status = (statusResponse as any).status;

			if (status === 'completed') {
				const result = (statusResponse as any).result || statusResponse;
				return {
					json: {
						success: true,
						operation: 'browserTask',
						workflow_id: workflowId,
						...result as any,
					},
					pairedItem: { item: itemIndex },
				};
			}

			if (status === 'failed' || status === 'timed_out') {
				const errorMessage = (statusResponse as any).error || `Browser task ${status}`;
				throw new NodeOperationError(
					this.getNode(),
					`Browser task ${status}: ${errorMessage}`,
					{ itemIndex },
				);
			}

			if (Date.now() - startTime >= maxWaitTime) {
				throw new NodeOperationError(
					this.getNode(),
					`Browser task did not complete within ${maxWaitTime / 1000} seconds. Last status: ${status}`,
					{ itemIndex },
				);
			}
		}

		throw new NodeOperationError(
			this.getNode(),
			`Browser task timed out after ${maxWaitTime / 1000} seconds`,
			{ itemIndex },
		);
	}
}
