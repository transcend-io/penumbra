export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  /** Default log level is INFO */
  public logLevel: LogLevel = LogLevel.INFO;

  /** The thread that the logger is running in */
  public thread:
    | '[Thread:main]'
    | `[Thread:worker-${number}]`
    | '[Thread:unknown]' = '[Thread:unknown]';

  /** Set the log level */
  public setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  public setThread(thread: '[Thread:main]' | `[Thread:worker-${number}]`) {
    this.thread = thread;
  }

  public debug(...message: unknown[]) {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(...message, this.thread);
    }
  }

  public info(...message: unknown[]) {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(...message, this.thread);
    }
  }

  public warn(...message: unknown[]) {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(...message, this.thread);
    }
  }

  public error(...message: unknown[]) {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(...message, this.thread);
    }
  }
}

export const logger = new Logger();
