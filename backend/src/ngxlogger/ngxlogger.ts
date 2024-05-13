const dbglvl = [
  'TRACE',
  'DEBUG',
  'INFO',
  'LOG',
  'WARN',
  'ERROR',
  'FATAL',
  'OFF',
];

const outputlevel = 0; // Errors,Fatals...

export class NGXLogger {
  private static instance: NGXLogger;

  private constructor() {}

  public static getInstance(): NGXLogger {
    if (!NGXLogger.instance) {
      NGXLogger.instance = new NGXLogger();
    }

    return NGXLogger.instance;
  }

  public createLogEntry(
    real_ip: string,
    lvl: string | number,
    msg: unknown,
    additional: string[],
  ) {
    const isoDate = new Date().toISOString();
    // const posArr = this.getPosition(this.getStackLine(4));
    let ilvl = 0;
    if (typeof lvl === 'string') {
      ilvl = dbglvl.indexOf(lvl);
    } else if (typeof lvl === 'number' && lvl >= 0 && lvl < dbglvl.length) {
      ilvl = lvl;
    }
    const log = {
      timestamp: isoDate,
      level: ilvl,
      // fileName: posArr[0],
      // lineNumber: posArr[1],
      real_ip,
      message: msg,
      additional,
    };
    return log;
  }

  public addAndShowLog(
    real_ip: string,
    lvl: string | number,
    msg: unknown,
    additional: string[],
  ) {
    const log = this.createLogEntry(real_ip, lvl, msg, additional);
    this.addLogEntry(log);
    this.log2console(log);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addLogEntry(_log: {
    timestamp: string;
    level: number;
    // fileName: string | number;
    // lineNumber: string | number;
    real_ip: unknown;
    message: unknown;
    additional: unknown;
  }) {}

  public log2string(log: {
    timestamp: string;
    level: number;
    // fileName: string | number;
    // lineNumber: string | number;
    real_ip: string;
    message: unknown;
    additional: string[];
  }) {
    // function log2srting(log) {
    let outpline =
      log.timestamp +
      ' ' +
      dbglvl[log.level] +
      log.real_ip +
      '\r\n' +
      (log.message || '(####)') +
      ' ';
    log.additional.forEach(function (val: string) {
      if (typeof val !== 'string') {
        outpline = outpline + JSON.stringify(val, undefined, '\r');
      } else {
        outpline = outpline + val;
      }
    });
    return outpline;
  }

  public log2console(log: {
    timestamp: string;
    level: number;
    real_ip: string;
    message: unknown;
    additional: string[];
  }) {
    if (parseInt(log.level.toString()) < outputlevel) {
      return;
    }
    const outpline = this.log2string(log) + '\r\n';
    switch (dbglvl[log.level]) {
      case 'TRACE':
        console.debug(outpline);
        break;
      case 'DEBUG':
        console.debug(outpline);
        break;
      case 'INFO':
        console.info(outpline);
        break;
      case 'LOG':
        console.log(outpline);
        break;
      case 'WARN':
        console.warn(outpline);
        break;
      case 'ERROR':
        console.error(outpline);
        break;
      case 'FATAL':
        console.error(outpline);
        break;
      case 'OFF':
        break;
    }
  }

  // public getPosition(stackLine: string) {
  //   const position = stackLine.substring(
  //     stackLine.lastIndexOf('(') + 1,
  //     stackLine.indexOf(')'),
  //   );
  //   const dataArray = position.split(':');
  //   // console.log('getPosition',stackLine,position,dataArray);
  //   if (dataArray.length === 3) {
  //     // unix
  //     return [dataArray[0], +dataArray[1], +dataArray[2]];
  //   } else if (dataArray.length === 4) {
  //     // windows
  //     return [dataArray[0] + ':' + dataArray[1], +dataArray[2], +dataArray[3]];
  //   } else {
  //     return ['unknown', 0, 0];
  //   }
  // }

  // Todo[myst] dafuq was this?
  // public getStackLine(lvl: number) {
  //   const error = new Error();

  //   try {
  //     // noinspection ExceptionCaughtLocallyJS
  //     throw error;
  //   } catch (e) {
  //     try {
  //       // console.info('stack',error.stack);
  //       return error.stack.split('\n')[lvl];
  //     } catch (e) {
  //       return null;
  //     }
  //   }
  // }
}
