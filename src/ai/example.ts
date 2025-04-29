import { z } from 'zod';
import { GoogleProvider, GoogleProviderOptions } from './model';

// Schema for structured output
const personSchema = z.object({
	name: z.string(),
	age: z.number(),
	interests: z.array(z.string()),
});

export async function main(apiKey: string) {
	// Create a provider with initial API key
	const provider = new GoogleProvider({
		apiKey: apiKey,
		responseModalities: ['TEXT'],
		temperature: 0.8,
	});

	// Initialize with model ID
	provider.initialize({
		modelId: 'gemini-2.5-flash-preview-04-17',
	});

	try {
		// Generate structured output
		const response = await provider.generateObject(
			'Generate a profile for a fictional person for testing.',
			personSchema
			// Override temperature for this request
		);
		return response;
	} catch (error) {
		console.error('Error generating object:', error);
	}
}
