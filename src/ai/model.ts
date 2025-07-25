// googleProvider.ts
import {
	createGoogleGenerativeAI,
	GoogleGenerativeAIProvider,
	type GoogleGenerativeAIProviderOptions,
} from '@ai-sdk/google'
import { generateObject, type LanguageModelV1 } from 'ai'
import type { z } from 'zod'
import { type ModelConfig, Provider, type ProviderOptions, type ProviderResponse } from './provider'

export interface GoogleProviderOptions extends ProviderOptions {
	responseModalities?: string[]
	temperature?: number
}

/**
 * Google AI Provider implementation
 */
export class GoogleProvider extends Provider<GoogleProviderOptions> {
	protected model: LanguageModelV1 | null = null

	/**
	 * Initialize the Google AI provider
	 * @param modelConfig Configuration for the specific model
	 */
	initialize(modelConfig: ModelConfig): void {
		this.modelId = modelConfig.modelId

		// Create Google AI client
		const google = createGoogleGenerativeAI({
			apiKey: this.options.apiKey,
		})

		// Initialize the model
		this.model = google(this.modelId, {
			structuredOutputs: true,
			// Add any additional model-specific configurations
			...modelConfig,
		})
	}

	/**
	 * Generate structured output using Google AI model
	 * @param prompt The prompt to send to the model
	 * @param schema The Zod schema for output validation
	 * @param additionalOptions Additional options for this specific request
	 */
	async generateObject<R>(
		prompt: string,
		schema: z.ZodType<R>,
		additionalOptions?: Partial<GoogleGenerativeAIProviderOptions>
	): Promise<ProviderResponse<R>> {
		if (!this.model) {
			throw new Error('Model not initialized. Call initialize() first.')
		}

		const providerOptions: GoogleGenerativeAIProviderOptions = {
			responseModalities: (this.options.responseModalities as ('TEXT' | 'IMAGE')[]) || ['TEXT'],
			...additionalOptions,
		}

		/**
		 * https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object
		 **/
		const result = await generateObject({
			model: this.model,
			schema: schema,
			prompt: prompt,
			output: 'array',
			providerOptions: {
				google: providerOptions,
			},
		})

		return {
			data: result.object,
		}
	}
}
