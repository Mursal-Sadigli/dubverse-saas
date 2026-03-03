import { EventEmitter } from "events";

/**
 * Global SSE emitter — pipeline events are emitted here,
 * and the SSE route handler listens to forward them to the client.
 *
 * Events emitted: `progress:<projectId>`
 * Payload: { step: string; percent: number; message: string }
 */
export const pipelineEmitter = new EventEmitter();
pipelineEmitter.setMaxListeners(100); // allow many concurrent projects

export interface ProgressEvent {
  step: string;
  percent: number;
  message: string;
}

export function emitProgress(projectId: string, payload: ProgressEvent) {
  pipelineEmitter.emit(`progress:${projectId}`, payload);
}
