import type { WorkspaceFile } from '../types/scrim';
import type {
  LanguageCompletion,
  LanguageDiagnostic,
  LanguageHover,
  LanguageSignatureHelp,
} from './typeScriptLanguageService';
import type {
  LanguageWorkerNotification,
  LanguageWorkerRequest,
  LanguageWorkerRequestWithoutId,
  LanguageWorkerResponse,
  LanguageWorkerResult,
} from './typeScriptWorkerProtocol';

export interface LanguageWorkerLike {
  addEventListener(type: 'message', listener: (event: MessageEvent<LanguageWorkerResponse>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<LanguageWorkerResponse>) => void): void;
  postMessage(message: LanguageWorkerRequest | LanguageWorkerNotification): void;
  terminate(): void;
}

type WorkerFactory = () => LanguageWorkerLike;

function defaultWorkerFactory(): LanguageWorkerLike {
  return new Worker(new URL('./typeScriptLanguage.worker.ts', import.meta.url), { type: 'module' });
}

function isJavaScriptLike(file: Pick<WorkspaceFile, 'path' | 'language'>): boolean {
  return file.language === 'javascript'
    || file.language === 'typescript'
    || /\.(?:js|jsx|ts|tsx)$/i.test(file.path);
}

export class TypeScriptWorkerClient {
  private worker: LanguageWorkerLike | null = null;
  private requestId = 0;
  private disposed = false;
  private readonly pending = new Map<number, {
    resolve: (value: LanguageWorkerResult) => void;
    reject: (reason: Error) => void;
  }>();

  constructor(private readonly workerFactory: WorkerFactory = defaultWorkerFactory) {}

  private readonly handleMessage = (event: MessageEvent<LanguageWorkerResponse>): void => {
    const response = event.data;
    const pending = this.pending.get(response.id);
    if (!pending) return;
    this.pending.delete(response.id);
    if (response.ok) pending.resolve(response.result);
    else pending.reject(new Error('error' in response ? response.error : 'No se pudo analizar el código.'));
  };

  private getWorker(): LanguageWorkerLike {
    if (this.disposed) throw new Error('El servicio de código está cerrado.');
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.worker.addEventListener('message', this.handleMessage);
    }
    return this.worker;
  }

  replaceWorkspace(files: Array<Pick<WorkspaceFile, 'path' | 'content' | 'language'>>): void {
    const semanticFiles = files
      .filter(isJavaScriptLike)
      .map(({ path, content }) => ({ path, content }));
    this.getWorker().postMessage({ type: 'workspace/replace', files: semanticFiles });
  }

  updateFile(path: string, content: string): void {
    this.getWorker().postMessage({ type: 'file/update', path, content });
  }

  diagnostics(path: string): Promise<LanguageDiagnostic[]> {
    return this.request<LanguageDiagnostic[]>({ type: 'diagnostics', path });
  }

  completions(path: string, position: number): Promise<LanguageCompletion[]> {
    return this.request<LanguageCompletion[]>({ type: 'completions', path, position });
  }

  hover(path: string, position: number): Promise<LanguageHover | null> {
    return this.request<LanguageHover | null>({ type: 'hover', path, position });
  }

  signatureHelp(path: string, position: number): Promise<LanguageSignatureHelp | null> {
    return this.request<LanguageSignatureHelp | null>({ type: 'signature', path, position });
  }

  private request<T extends LanguageWorkerResult>(
    request: LanguageWorkerRequestWithoutId,
  ): Promise<T> {
    if (this.disposed) return Promise.reject(new Error('El servicio de código está cerrado.'));
    const worker = this.getWorker();
    const id = ++this.requestId;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      worker.postMessage({ ...request, id } as LanguageWorkerRequest);
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.worker) {
      this.worker.removeEventListener('message', this.handleMessage);
      this.worker.terminate();
      this.worker = null;
    }
    const error = new Error('El servicio de código está cerrado.');
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
}
