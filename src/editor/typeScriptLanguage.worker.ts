/// <reference lib="webworker" />

import { typeScriptLibraries } from 'virtual:typescript-libraries';
import { TypeScriptLanguageService } from './typeScriptLanguageService';
import type {
  LanguageWorkerNotification,
  LanguageWorkerRequest,
  LanguageWorkerResponse,
} from './typeScriptWorkerProtocol';

const languageService = new TypeScriptLanguageService(typeScriptLibraries);
const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.addEventListener('message', (event: MessageEvent<LanguageWorkerRequest | LanguageWorkerNotification>) => {
  const message = event.data;
  if (message.type === 'workspace/replace') {
    languageService.replaceWorkspace(message.files);
    return;
  }
  if (message.type === 'file/update') {
    languageService.updateFile(message.path, message.content);
    return;
  }

  let response: LanguageWorkerResponse;
  try {
    let result;
    switch (message.type) {
      case 'diagnostics':
        result = languageService.diagnostics(message.path);
        break;
      case 'completions':
        result = languageService.completions(message.path, message.position);
        break;
      case 'hover':
        result = languageService.hover(message.path, message.position);
        break;
      case 'signature':
        result = languageService.signatureHelp(message.path, message.position);
        break;
    }
    response = { id: message.id, ok: true, result };
  } catch (error) {
    response = {
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo analizar el código.',
    };
  }
  workerScope.postMessage(response);
});
