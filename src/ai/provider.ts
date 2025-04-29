// types.ts
export interface ProviderOptions {
	apiKey: string;
	[key: string]: any;
}

export interface ProviderResponse<T> {
	// output array = T[]
	data: T[];
	[key: string]: any;
}

export interface ModelConfig {
	modelId: string;
	[key: string]: any;
}

// provider.ts
import { z } from 'zod';

/**
 * Abstract Provider class for AI model interactions
 */
export abstract class Provider<T extends ProviderOptions> {
	protected options: T;
	protected modelId: string;
	protected model: any = null;

	/**
	 * Constructor for the Provider class
	 * @param options Provider-specific configuration options
	 */
	constructor(options: T) {
		this.options = options;
		this.modelId = '';
	}

	/**
	 * Initialize the provider with given options
	 * @param modelConfig Configuration for the specific model
	 */
	abstract initialize(modelConfig: ModelConfig): void;

	/**
	 * Send a message to the AI model
	 * @param prompt The prompt to send to the model
	 * @param schema The Zod schema for structured output validation
	 * @param additionalOptions Any additional provider-specific options
	 */
	abstract generateObject<R>(
		prompt: string,
		schema: z.ZodType<R>,
		additionalOptions?: any
	): Promise<ProviderResponse<R>>;

	/**
	 * Get the current API key
	 */
	getApiKey(): string {
		return this.options.apiKey;
	}

	/**
	 * Update the provider's API key
	 * @param apiKey New API key
	 */
	setApiKey(apiKey: string): void {
		this.options.apiKey = apiKey;
		// Re-initialize to apply the new API key
		if (this.modelId) {
			this.initialize({ modelId: this.modelId });
		}
	}
}
