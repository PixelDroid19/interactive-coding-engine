/// <reference lib="webworker" />
import { CellsRuntimeSession } from './cellsRuntimeSession';
import type { CellsWorkerRequest } from './cellsWorkerProtocol';

const sessions = new Map<string, CellsRuntimeSession>();

self.addEventListener('message', async (event: MessageEvent<CellsWorkerRequest>) => {
  const request = event.data;
  let session = sessions.get(request.sessionId);
  if (!session) {
    session = new CellsRuntimeSession(request.sessionId);
    sessions.set(request.sessionId, session);
  }
  const result = await session.handle(request);
  if (result.type === 'project:exported') {
    self.postMessage(result, { transfer: [result.payload.bytes.buffer] });
  } else {
    self.postMessage(result);
  }
  if (request.type === 'runtime:dispose') sessions.delete(request.sessionId);
});
