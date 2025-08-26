import type { JobID } from './job-id.js';
import type { RemoteResource } from './types.js';
import parseBase64OrUint8Array from './utils/parse-base64-or-uint8array.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private isMainThread = !!self.document;

  /** Default log level is INFO */
  public logLevel: LogLevel = LogLevel.INFO;

  /** The thread that the logger is running in */
  public thread: 'main' | `worker-${number}` | `worker-null` = this.isMainThread
    ? 'main'
    : `worker-null`;

  /** Set the log level */
  public setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  /** Set the thread that the logger is running in */
  public setThread(thread: 'main' | `worker-${number}`) {
    this.thread = thread;
  }

  /** Global tracker of worker job progress */
  public workerJobTracker = this.isMainThread
    ? null
    : new Map<JobID, { progressEmitted?: boolean }>();

  /** Redact a RemoteResource for logging purposes */
  public redactRemoteResource(resource: RemoteResource): RemoteResource {
    if (!resource.decryptionOptions) {
      return resource;
    }
    return {
      ...resource,
      decryptionOptions: {
        ...resource.decryptionOptions,
        key: `[REDACTED] ${parseBase64OrUint8Array(resource.decryptionOptions.key).length.toString()}-byte key`,
      },
    };
  }

  public debug(message: unknown, jobID: JobID | null) {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(this.makeHeader(jobID), message);
    }
  }

  public info(message: unknown, jobID: JobID | null) {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(this.makeHeader(jobID), message);
    }
  }

  public warn(message: unknown, jobID: JobID | null) {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.makeHeader(jobID), message);
    }
  }

  public error(message: unknown, jobID: JobID | null) {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(this.makeHeader(jobID), message);
    }
  }

  /** The header for the logger */
  private makeHeader(jobID: JobID | null) {
    const jobIDShort = jobID ? `:${jobID.split('-')[0] ?? ''}` : '';
    return `[penumbra${jobIDShort}:${this.thread}]`.padEnd(29, ' ');
  }
}

export const logger = new Logger();
