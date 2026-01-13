import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

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
		this.logger.info(`Submitting scraping job for URL: ${url}`);
		
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

		this.logger.info(`Job submitted successfully. Request ID: ${requestId}`);

		// Step 2: Poll for completion
		const startTime = Date.now();
		let attempts = 0;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;
			
			// Wait before checking status (except first attempt)
			if (attempts > 1) {
				await new Promise((resolve) => {
					const timer = (this.constructor as any).prototype.constructor('return this')().setTimeout;
					timer(resolve, pollInterval);
				});
			}

			this.logger.info(`Checking status (attempt ${attempts}) for request ID: ${requestId}`);

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
			
			this.logger.info(`Current status: ${status}`);

			// Check if job is completed
			if (status === 'completed' || status === 'success') {
				this.logger.info(`Job completed successfully for request ID: ${requestId}`);
				
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
			this.logger.info(`Job still processing... (${status})`);
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

		this.logger.info(`Executing search: ${prompt}`);

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

		this.logger.info(`Search completed successfully`);

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

		// Step 1: Submit the agentic search job
		this.logger.info(`Submitting agentic search job: ${prompt}`);
		
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

		this.logger.info(`Agentic search job submitted successfully. Job ID: ${jobId}`);

		// Step 2: Poll for completion
		const startTime = Date.now();
		let attempts = 0;

		while (Date.now() - startTime < maxWaitTime) {
			attempts++;
			
			// Wait before checking status (except first attempt)
			if (attempts > 1) {
				await new Promise((resolve) => {
					const timer = (this.constructor as any).prototype.constructor('return this')().setTimeout;
					timer(resolve, pollInterval);
				});
			}

			this.logger.info(`Checking agentic search status (attempt ${attempts}) for job ID: ${jobId}`);

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
			
			this.logger.info(`Current status: ${status}`);

			// Check if job is completed
			if (status === 'completed') {
				this.logger.info(`Agentic search completed successfully for job ID: ${jobId}`);
				
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
			this.logger.info(`Agentic search still processing... (${status})`);
		}

		throw new NodeOperationError(
			this.getNode(),
			`Agentic search timed out after ${maxWaitTime / 1000} seconds`,
			{ itemIndex },
		);
	}
}

