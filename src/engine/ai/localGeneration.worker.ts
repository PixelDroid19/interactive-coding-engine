/// <reference lib="webworker" />

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

declare const self: DedicatedWorkerGlobalScope;

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (event) => handler.onmessage(event);

export {};
