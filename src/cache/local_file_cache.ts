// node imports
import Fs from "node:fs";

// npm imports
import { BaseCache, serializeGeneration, deserializeStoredGeneration } from "@langchain/core/caches";
import { Generation } from "@langchain/core/outputs";



const GLOBAL_CACHE = new Map<string, any>();

export class LocalFileCache<T = Generation[]> extends BaseCache<T> {
	private cache: Map<string, T>;
	private filePath: string;

	constructor(filePath: string, cache: Map<string, T> = GLOBAL_CACHE) {
		super();
		this.cache = cache;
		this.filePath = filePath;
	}
	async init(): Promise<void> {
		const fileExists = await Fs.promises.access(this.filePath).then(() => true).catch(() => false);

		// if file exists, load its content into the cache
		if (fileExists) {
			const data = await Fs.promises.readFile(this.filePath, 'utf-8');
			const parsedData: [string, any][] = JSON.parse(data);
			for (const [cache_key, serializedGenerations] of parsedData) {
				// reconstruct generations array
				const generations: any = [];
				for (const serializedGeneration of serializedGenerations) {
					generations.push(deserializeStoredGeneration(serializedGeneration) as T);
				}
				// set in cache
				this.cache.set(cache_key, generations);
			}
		}
	}

	/**
	 * Saves the current cache to a local file in JSON format.
	 */
	async _saveToFile(): Promise<void> {
		// serialize the cache into an array of [key, serializedGenerations]
		const cacheArray: [string, any][] = Array.from(this.cache.entries())
		const serializedCacheArray: [string, any][] = []
		for (const [cache_key, generations] of cacheArray) {
			const serializedGenerations: any[] = []
			for (const generation of generations) {
				const serializedGeneration = serializeGeneration(generation);
				serializedGenerations.push(serializedGeneration);
			}
			serializedCacheArray.push([cache_key, serializedGenerations]);
		}

		// write the cache to a file
		const data = JSON.stringify(serializedCacheArray, null, 2);
		await Fs.promises.writeFile(this.filePath, data, 'utf-8');
	}

	/**
	 * Retrieves data from the cache using a prompt and an LLM key. If the
	 * data is not found, it returns null.
	 * @param prompt The prompt used to find the data.
	 * @param llmKey The LLM key used to find the data.
	 * @returns The data corresponding to the prompt and LLM key, or null if not found.
	 */
	lookup(prompt: string, llmKey: string): Promise<T | null> {
		const cached_value = this.cache.get(this.keyEncoder(prompt, llmKey));
		return Promise.resolve(cached_value ?? null)
	}

	/**
	 * Updates the cache with new data using a prompt and an LLM key.
	 * @param prompt The prompt used to store the data.
	 * @param llmKey The LLM key used to store the data.
	 * @param value The data to be stored.
	 */
	async update(prompt: string, llmKey: string, value: T): Promise<void> {
		this.cache.set(this.keyEncoder(prompt, llmKey), value);
		// update cache on disk
		await this._saveToFile();
	}
}