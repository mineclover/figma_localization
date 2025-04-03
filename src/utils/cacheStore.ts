type CacheItem<T> = {
	data: T;
	timestamp: number;
};

type CacheConfig = {
	ttl: number; // Time To Live in milliseconds
};

export class CacheStore<T = unknown> {
	private cache: Map<string, CacheItem<T>>;
	private config: CacheConfig;

	constructor(config: CacheConfig = { ttl: 1000 }) {
		this.cache = new Map();
		this.config = config;
	}

	set(key: string, value: T): void {
		this.cache.set(key, {
			data: value,
			timestamp: Date.now(),
		});
	}

	get(key: string): T | null {
		const item = this.cache.get(key);
		if (!item) return null;

		const now = Date.now();
		if (now - item.timestamp > this.config.ttl) {
			this.cache.delete(key);
			return null;
		}

		return item.data;
	}

	has(key: string): boolean {
		const item = this.cache.get(key);
		if (!item) return false;

		const now = Date.now();
		if (now - item.timestamp > this.config.ttl) {
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}
}

type FetchLike<P = any> = {
	<V extends keyof P>(url: V, init?: RequestInit): Promise<Response>;
};

// 캐시된 fetch 함수를 생성하는 유틸리티
export const createCachedFetch = <P = any, T = any>(fetchFn: FetchLike<P>, config?: CacheConfig) => {
	const cacheStore = new CacheStore<T>(config);

	return async <V extends keyof P>(input: V, init?: RequestInit): Promise<T> => {
		const cacheKey = input.toString();

		const cachedData = cacheStore.get(cacheKey);
		if (cachedData) {
			return cachedData;
		}

		const response = await fetchFn(input, init);
		const data = (await response.json()) as T;
		cacheStore.set(cacheKey, data);

		return data;
	};
};
