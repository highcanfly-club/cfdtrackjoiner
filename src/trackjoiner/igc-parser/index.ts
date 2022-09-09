/* eslint-disable @typescript-eslint/no-namespace */
const MANUFACTURERS = [
  { 'name': 'Aircotec', 'long': 'ACT', 'short': 'I' },
  { 'name': 'Cambridge Aero Instruments', 'long': 'CAM', 'short': 'C' },
  { 'name': 'ClearNav Instruments', 'long': 'CNI', 'short': null },
  { 'name': 'Data Swan/DSX', 'long': 'DSX', 'short': 'D' },
  { 'name': 'EW Avionics', 'long': 'EWA', 'short': 'E' },
  { 'name': 'Filser', 'long': 'FIL', 'short': 'F' },
  { 'name': 'Flarm', 'long': 'FLA', 'short': 'G' },
  { 'name': 'Flytech', 'long': 'FLY', 'short': null },
  { 'name': 'Garrecht', 'long': 'GCS', 'short': 'A' },
  { 'name': 'IMI Gliding Equipment', 'long': 'IMI', 'short': 'M' },
  { 'name': 'Logstream', 'long': 'LGS', 'short': null },
  { 'name': 'LX Navigation', 'long': 'LXN', 'short': 'L' },
  { 'name': 'LXNAV', 'long': 'LXV', 'short': 'V' },
  { 'name': 'Naviter', 'long': 'NAV', 'short': null },
  { 'name': 'New Technologies', 'long': 'NTE', 'short': 'N' },
  { 'name': 'Nielsen Kellerman', 'long': 'NKL', 'short': 'K' },
  { 'name': 'Peschges', 'long': 'PES', 'short': 'P' },
  { 'name': 'PressFinish Electronics', 'long': 'PFE', 'short': null },
  { 'name': 'Print Technik', 'long': 'PRT', 'short': 'R' },
  { 'name': 'Scheffel', 'long': 'SCH', 'short': 'H' },
  { 'name': 'Streamline Data Instruments', 'long': 'SDI', 'short': 'S' },
  { 'name': 'Triadis Engineering GmbH', 'long': 'TRI', 'short': 'T' },
  { 'name': 'Zander', 'long': 'ZAN', 'short': 'Z' },
  { 'name': 'XCSoar', 'long': 'XCS', 'short': null },
  { 'name': 'LK8000', 'long': 'XLK', 'short': null },
  { 'name': 'GpsDump', 'long': 'XGD', 'short': null },
  { 'name': 'SeeYou Recorder', 'long': 'XCM', 'short': null },
  { 'name': 'Flyskyhy', 'long': 'XFH', 'short': null },
  { 'name': 'XCTrack', 'long': 'XCT', 'short': null },
  { 'name': 'Flymaster Live', 'long': 'XFM', 'short': null },
  { 'name': 'XCTracer', 'long': 'XTR', 'short': null },
  { 'name': 'SkyBean', 'long': 'XSB', 'short': null },
  { 'name': 'leGPSBip', 'long': 'XSD', 'short': null },
  { 'name': 'Logfly', 'long': 'XLF', 'short': null },
  { 'name': 'Loctome', 'long': 'XLM', 'short': null }
];

const lookupManufacturer = function (id:string) {
  const short = id.length === 1;

  id = id.toUpperCase();

  const manufacturers = MANUFACTURERS.filter(it => it[short ? 'short' : 'long'] === id);
  return manufacturers.length !== 0 ? manufacturers[0].name : id;
};

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

/* tslint:disable:max-line-length */
const RE_A = /^A(\w{3})(\w{3,}?)(?:FLIGHT:(\d+)|:(.+))?$/;
const RE_HFDTE = /^HFDTE(?:DATE:)?(\d{2})(\d{2})(\d{2})(?:,?(\d{2}))?/;
const RE_PLT_HEADER = /^H(\w)PLT(?:.{0,}?:(.*)|(.*))$/;
const RE_CM2_HEADER = /^H(\w)CM2(?:.{0,}?:(.*)|(.*))$/; // P is used by some broken Flarms
const RE_GTY_HEADER = /^H(\w)GTY(?:.{0,}?:(.*)|(.*))$/;
const RE_GID_HEADER = /^H(\w)GID(?:.{0,}?:(.*)|(.*))$/;
const RE_CID_HEADER = /^H(\w)CID(?:.{0,}?:(.*)|(.*))$/;
const RE_CCL_HEADER = /^H(\w)CCL(?:.{0,}?:(.*)|(.*))$/;
const RE_SIT_HEADER = /^H(\w)SIT(?:.{0,}?:(.*)|(.*))$/;
const RE_FTY_HEADER = /^H(\w)FTY(?:.{0,}?:(.*)|(.*))$/;
const RE_RFW_HEADER = /^H(\w)RFW(?:.{0,}?:(.*)|(.*))$/;
const RE_RHW_HEADER = /^H(\w)RHW(?:.{0,}?:(.*)|(.*))$/;
const RE_B = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})([NS])(\d{3})(\d{2})(\d{3})([EW])([AV])(-\d{4}|\d{5})(-\d{4}|\d{5})/;
const RE_K = /^K(\d{2})(\d{2})(\d{2})/;
const RE_IJ = /^[IJ](\d{2})(?:\d{2}\d{2}[A-Z]{3})+/;
const RE_TASK = /^C(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{4})([-\d]{2})(.*)/;
const RE_TASKPOINT = /^C(\d{2})(\d{2})(\d{3})([NS])(\d{3})(\d{2})(\d{3})([EW])(.*)/;
/* tslint:enable:max-line-length */

const VALID_DATA_SOURCES = ['F', 'O', 'P', 'S']; // Broken XCTrack

declare namespace IGCParser {
  export interface Options {
    lenient?: boolean;
  }

  export interface IGCFile {
    /** UTC date of the flight in ISO 8601 format */
    date: string;
    numFlight: number | null;

    pilot: string | null;
    copilot: string | null;

    gliderType: string | null;
    registration: string | null;
    callsign: string | null;
    competitionClass: string | null;
    site: string | null;

    loggerId: string | null;
    loggerManufacturer: string;
    loggerType: string | null;
    firmwareVersion: string | null;
    hardwareVersion: string | null;

    task: Task | null;

    fixes: BRecord[];
    dataRecords: KRecord[];

    security: string | null;

    errors: Error[];
  }

  interface PartialIGCFile extends Partial<IGCFile> {
    fixes: BRecord[];
    dataRecords: KRecord[];
  }

  export interface ARecord {
    manufacturer: string;
    loggerId: string | null;
    numFlight: number | null;
    additionalData: string | null;
  }

  export interface BRecord {
    /** Unix timestamp of the GPS fix in milliseconds */
    timestamp: number;

    /** UTC time of the GPS fix in ISO 8601 format */
    time: string;

    latitude: number;
    longitude: number;
    valid: boolean;
    pressureAltitude: number | null;
    gpsAltitude: number | null;

    extensions: RecordExtensions;

    fixAccuracy: number | null;

    /** Engine Noise Level from 0.0 to 1.0 */
    enl: number | null;
  }

  export interface KRecord {
    /** Unix timestamp of the data record in milliseconds */
    timestamp: number;

    /** UTC time of the data record in ISO 8601 format */
    time: string;

    extensions: RecordExtensions;
  }

  export interface RecordExtensions {
    [code: string]: string;
  }

  export interface RecordExtension {
    code: string;
    start: number;
    length: number;
  }

  export interface Task {
    declarationDate: string;
    declarationTime: string;
    declarationTimestamp: number;

    flightDate: string | null;
    taskNumber: number | null;

    numTurnpoints: number;
    comment: string | null;

    points: TaskPoint[];
  }

  export interface TaskPoint {
    latitude: number;
    longitude: number;
    name: string | null;
  }
}

class IGCParser {
  private _result: IGCParser.PartialIGCFile = {
    numFlight: null,
    pilot: null,
    copilot: null,
    gliderType: null,
    registration: null,
    callsign: null,
    competitionClass: null,
    loggerType: null,
    firmwareVersion: null,
    hardwareVersion: null,
    task: null,
    fixes: [],
    dataRecords: [],
    security: null,
    errors: [],
  };

  private options: IGCParser.Options;
  private fixExtensions: IGCParser.RecordExtension[] = [];
  private dataExtensions: IGCParser.RecordExtension[] = [];

  private lineNumber = 0;
  private prevTimestamp: number | null = null;

  static parse(str: string, options: IGCParser.Options = {}): IGCParser.IGCFile {
    const parser = new IGCParser(options);

    const errors = [];
    for (const line of str.split('\n')) {
      try {
        parser.processLine(line.trim());
      } catch (error) {
        if (options.lenient) {
          errors.push(error as Error);
        } else {
          throw error;
        }
      }
    }

    const result = parser.result;
    result.errors = errors;

    return result;
  }

  constructor(options: IGCParser.Options = {}) {
    this.options = options;
  }

  get result(): IGCParser.IGCFile {
    if (!this._result.loggerManufacturer) {
      throw new Error(`Missing A record`);
    }

    if (!this._result.date) {
      throw new Error(`Missing HFDTE record`);
    }

    return this._result as IGCParser.IGCFile;
  }

  private processLine(line: string) {
    this.lineNumber += 1;

    const recordType = line[0];

    if (recordType === 'B') {
      const fix = this.parseBRecord(line);

      this.prevTimestamp = fix.timestamp;

      this._result.fixes.push(fix);

    } else if (recordType === 'K') {
      const data = this.parseKRecord(line);

      this.prevTimestamp = data.timestamp;

      this._result.dataRecords.push(data);

    } else if (recordType === 'H') {
      this.processHeader(line);

    } else if (recordType === 'C') {
      this.processTaskLine(line);

    } else if (recordType === 'A') {
      const record = this.parseARecord(line);

      this._result.loggerId = record.loggerId;
      this._result.loggerManufacturer = record.manufacturer;

      if (record.numFlight !== null) {
        this._result.numFlight = record.numFlight;
      }

    } else if (recordType === 'I') {
      this.fixExtensions = this.parseIJRecord(line);

    } else if (recordType === 'J') {
      this.dataExtensions = this.parseIJRecord(line);

    } else if (recordType === 'G') {
      this._result.security = (this._result.security || '') + line.slice(1);
    }
  }

  private processHeader(line: string) {
    const headerType = line.slice(2, 5);
    if (headerType === 'DTE') {
      const record = this.parseDateHeader(line);

      this._result.date = record.date;

      if (record.numFlight !== null) {
        this._result.numFlight = record.numFlight;
      }

    } else if (headerType === 'PLT') {
      this._result.pilot = this.parsePilot(line);
    } else if (headerType === 'CM2') {
      this._result.copilot = this.parseCopilot(line);
    } else if (headerType === 'GTY') {
      this._result.gliderType = this.parseGliderType(line);
    } else if (headerType === 'GID') {
      this._result.registration = this.parseRegistration(line);
    } else if (headerType === 'CID') {
      this._result.callsign = this.parseCallsign(line);
    } else if (headerType === 'CCL') {
      this._result.competitionClass = this.parseCompetitionClass(line);
    } else if (headerType === 'SIT') {
      this._result.site = this.parseSite(line);
    } else if (headerType === 'FTY') {
      this._result.loggerType = this.parseLoggerType(line);
    } else if (headerType === 'RFW') {
      this._result.firmwareVersion = this.parseFirmwareVersion(line);
    } else if (headerType === 'RHW') {
      this._result.hardwareVersion = this.parseHardwareVersion(line);
    }
  }

  private parseARecord(line: string): IGCParser.ARecord {
    let match = line.match(RE_A);
    if (match) {
      const manufacturer = lookupManufacturer(match[1]);
      const loggerId = match[2];
      const numFlight = match[3] ? parseInt(match[3], 10) : null;
      const additionalData = match[4] || null;
      return {manufacturer, loggerId, numFlight, additionalData};
    }

    match = line.match(/^A(\w{3})(.+)?$/);
    if (match) {
      const manufacturer = lookupManufacturer(match[1]);
      const additionalData = match[2] ? match[2].trim() : null;
      return { manufacturer, loggerId: null, numFlight: null, additionalData };
    }

    throw new Error(`Invalid A record at line ${this.lineNumber}: ${line}`);
  }

  private parseDateHeader(line: string): { date: string, numFlight: number | null } {
    const match = line.match(RE_HFDTE);
    if (!match) {
      throw new Error(`Invalid DTE header at line ${this.lineNumber}: ${line}`);
    }

    const lastCentury = match[3][0] === '8' || match[3][0] === '9';
    const date = `${lastCentury ? '19' : '20'}${match[3]}-${match[2]}-${match[1]}`;

    const numFlight = match[4] ? parseInt(match[4], 10) : null;

    return { date, numFlight };
  }

  private parseTextHeader(headerType: string, regex: RegExp, line: string, underscoreReplacement = ' '): string {
    const match = line.match(regex);
    if (!match) {
      throw new Error(`Invalid ${headerType} header at line ${this.lineNumber}: ${line}`);
    }

    const dataSource = match[1];
    if (VALID_DATA_SOURCES.indexOf(dataSource) === -1 && !this.options.lenient) {
      throw new Error(`Invalid data source at line ${this.lineNumber}: ${dataSource}`);
    }

    return (match[2] || match[3] || '').replace(/_/g, underscoreReplacement).trim();
  }

  private parsePilot(line: string): string {
    return this.parseTextHeader('PLT', RE_PLT_HEADER, line);
  }

  private parseCopilot(line: string): string {
    return this.parseTextHeader('CM2', RE_CM2_HEADER, line);
  }

  private parseGliderType(line: string): string {
    return this.parseTextHeader('GTY', RE_GTY_HEADER, line);
  }

  private parseRegistration(line: string): string {
    return this.parseTextHeader('GID', RE_GID_HEADER, line, '-');
  }

  private parseCallsign(line: string): string {
    return this.parseTextHeader('GTY', RE_CID_HEADER, line);
  }

  private parseCompetitionClass(line: string): string {
    return this.parseTextHeader('GID', RE_CCL_HEADER, line);
  }

  private parseSite(line: string): string {
    return this.parseTextHeader('SIT', RE_SIT_HEADER, line);
  }

  private parseLoggerType(line: string): string {
    return this.parseTextHeader('FTY', RE_FTY_HEADER, line);
  }

  private parseFirmwareVersion(line: string): string {
    return this.parseTextHeader('RFW', RE_RFW_HEADER, line);
  }

  private parseHardwareVersion(line: string): string {
    return this.parseTextHeader('RHW', RE_RHW_HEADER, line);
  }

  private processTaskLine(line: string) {
    if (!this._result.task) {
      this._result.task = this.parseTask(line);
    } else {
      this._result.task.points.push(this.parseTaskPoint(line));
    }
  }

  private parseTask(line: string): IGCParser.Task {
    const match = line.match(RE_TASK);
    if (!match) {
      throw new Error(`Invalid task declaration at line ${this.lineNumber}: ${line}`);
    }

    let lastCentury = match[3][0] === '8' || match[3][0] === '9';
    const declarationDate = `${lastCentury ? '19' : '20'}${match[3]}-${match[2]}-${match[1]}`;
    const declarationTime = `${match[4]}:${match[5]}:${match[6]}`;
    const declarationTimestamp = Date.parse(`${declarationDate}T${declarationTime}Z`);

    let flightDate = null;
    if (match[7] !== '00' || match[8] !== '00' || match[9] !== '00') {
      lastCentury = match[9][0] === '8' || match[9][0] === '9';
      flightDate = `${lastCentury ? '19' : '20'}${match[9]}-${match[8]}-${match[7]}`;
    }

    const taskNumber = (match[10] !== '0000') ? parseInt(match[10], 10) : null;
    const numTurnpoints = parseInt(match[11], 10);
    const comment = match[12] || null;

    return {
      declarationDate,
      declarationTime,
      declarationTimestamp,
      flightDate,
      taskNumber,
      numTurnpoints,
      comment,
      points: [],
    };
  }

  private parseTaskPoint(line: string): IGCParser.TaskPoint {
    const match = line.match(RE_TASKPOINT);
    if (!match) {
      throw new Error(`Invalid task point declaration at line ${this.lineNumber}: ${line}`);
    }

    const latitude = IGCParser.parseLatitude(match[1], match[2], match[3], match[4]);
    const longitude = IGCParser.parseLongitude(match[5], match[6], match[7], match[8]);
    const name = match[9] || null;

    return { latitude, longitude, name };
  }

  private parseBRecord(line: string): IGCParser.BRecord {
    if (!this._result.date) {
      throw new Error(`Missing HFDTE record before first B record`);
    }

    const match = line.match(RE_B);
    if (!match) {
      throw new Error(`Invalid B record at line ${this.lineNumber}: ${line}`);
    }

    const time = `${match[1]}:${match[2]}:${match[3]}`;
    const timestamp = this.calcTimestamp(time);

    const latitude = IGCParser.parseLatitude(match[4], match[5], match[6], match[7]);
    const longitude = IGCParser.parseLongitude(match[8], match[9], match[10], match[11]);

    const valid = match[12] === 'A';

    const pressureAltitude = match[13] === '00000' ? null : parseInt(match[13], 10);
    const gpsAltitude = match[14] === '00000' ? null : parseInt(match[14], 10);

    const extensions: IGCParser.RecordExtensions = {};
    if (this.fixExtensions) {
      for (const { code, start, length } of this.fixExtensions) {
        extensions[code] = line.slice(start, start + length);
      }
    }

    let enl = null;
    if (extensions['ENL']) {
      const enlLength = this.fixExtensions.filter(it => it.code === 'ENL')[0].length;
      const enlMax = Math.pow(10, enlLength);

      enl = parseInt(extensions['ENL'], 10) / enlMax;
    }

    const fixAccuracy = extensions['FXA'] ? parseInt(extensions['FXA'], 10) : null;

    return {
      timestamp,
      time,
      latitude,
      longitude,
      valid,
      pressureAltitude,
      gpsAltitude,
      extensions,
      enl,
      fixAccuracy,
    };
  }

  private parseKRecord(line: string): IGCParser.KRecord {
    if (!this._result.date) {
      throw new Error(`Missing HFDTE record before first K record`);
    }

    if (!this.dataExtensions) {
      throw new Error(`Missing J record before first K record`);
    }

    const match = line.match(RE_K);
    if (!match) {
      throw new Error(`Invalid K record at line ${this.lineNumber}: ${line}`);
    }

    const time = `${match[1]}:${match[2]}:${match[3]}`;
    const timestamp = this.calcTimestamp(time);

    const extensions: IGCParser.RecordExtensions = {};
    if (this.dataExtensions) {
      for (const { code, start, length } of this.dataExtensions) {
        extensions[code] = line.slice(start, start + length);
      }
    }

    return { timestamp, time, extensions };
  }

  private parseIJRecord(line: string): IGCParser.RecordExtension[] {
    const match = line.match(RE_IJ);
    if (!match) {
      throw new Error(`Invalid ${line[0]} record at line ${this.lineNumber}: ${line}`);
    }

    const num = parseInt(match[1], 10);
    if (line.length < 3 + num * 7) {
      throw new Error(`Invalid ${line[0]} record at line ${this.lineNumber}: ${line}`);
    }

    const extensions = new Array<IGCParser.RecordExtension>(num);

    for (let i = 0; i < num; i++) {
      const offset = 3 + i * 7;
      const start = parseInt(line.slice(offset, offset + 2), 10) - 1;
      const end = parseInt(line.slice(offset + 2, offset + 4), 10) - 1;
      const length = end - start + 1;
      const code = line.slice(offset + 4, offset + 7);

      extensions[i] = { start, length, code };
    }

    return extensions;
  }

  private static parseLatitude(dd: string, mm: string, mmm: string, ns: string): number {
    const degrees = parseInt(dd, 10) + parseFloat(`${mm}.${mmm}`) / 60;
    return (ns === 'S') ? -degrees : degrees;
  }

  private static parseLongitude(ddd: string, mm: string, mmm: string, ew: string): number {
    const degrees = parseInt(ddd, 10) + parseFloat(`${mm}.${mmm}`) / 60;
    return (ew === 'W') ? -degrees : degrees;
  }

  /**
   * Figures out a Unix timestamp in milliseconds based on the
   * date header value, the time field in the current record and
   * the previous timestamp.
   */
  private calcTimestamp(time: string): number {
    let timestamp = Date.parse(`${this._result.date}T${time}Z`);

    // allow timestamps one hour before the previous timestamp,
    // otherwise we assume the next day is meant
    while (this.prevTimestamp && timestamp < this.prevTimestamp - ONE_HOUR) {
      timestamp += ONE_DAY;
    }

    return timestamp;
  }
}

export {IGCParser};
