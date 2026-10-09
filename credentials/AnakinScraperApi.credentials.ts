import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AnakinScraperApi implements ICredentialType {
	name = 'anakinScraperApi';
	displayName = 'Anakin Scraper API';
	// Reuses the node's icons; the build copies them to the same relative place in dist.
	icon = {
		light: 'file:../nodes/AnakinScraper/anakin.svg',
		dark: 'file:../nodes/AnakinScraper/anakin.dark.svg',
	} as const;
	documentationUrl = 'https://anakin.io/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Anakin API authentication token',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.anakin.io',
			required: true,
			description: 'The base URL of the Anakin API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/health',
			method: 'GET',
		},
	};
}

