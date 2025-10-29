# langchain-extra

Extra utilities and extensions for LangChain to enhance your AI development workflow.

## Features

- **LocalFileCache**: A persistent file-based cache for LangChain LLM responses that saves to disk and persists across sessions

## Installation

```bash
npm install langchain-extra
```

Or with yarn:

```bash
yarn add langchain-extra
```

## Usage

### LocalFileCache

The `LocalFileCache` provides persistent caching of LLM responses to a local JSON file. This helps reduce API calls and speeds up development by caching identical prompts.


#### Features

- **Persistent Storage**: Cache survives application restarts
- **Global Cache**: Multiple instances can share the same cache
- **No configuration needed**: Easy to set up and use
- **Free of charge**: No additional costs for using local file storage


#### Basic Usage

```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import LocalFileCache from "langchain-extra/src/cache/local_file_cache.js";

async function main() {
  // Initialize the cache with a file path
  const localFileCache = new LocalFileCache("./my_cache.json");
  await localFileCache.init();

  // Create your LLM with the cache
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    cache: localFileCache, // Add the cache here
  });

  // First call - will hit the API and cache the result
  console.time("First call");
  const response1 = await llm.invoke([
    ["system", "You are a helpful assistant."],
    ["human", "Hello, how are you?"],
  ]);
  console.log(response1.text);
  console.timeEnd("First call");

  // Second call - will use cached result (much faster!)
  console.time("Second call (cached)");
  const response2 = await llm.invoke([
    ["system", "You are a helpful assistant."],
    ["human", "Hello, how are you?"],
  ]);
  console.log(response2.text);
  console.timeEnd("Second call (cached)");
}

main();
```
## License

MIT

## Repository

[https://github.com/jeromeetienne/langchain-extra](https://github.com/jeromeetienne/langchain-extra)