export class FitParser {
    constructor(options?: Options);
    options: Options;
    parse(content: string|ArrayBuffer, callback: (error: string | null, data: FitData) => void):void;
}
export interface Options {
    force?: boolean;
    speedUnit?: string;
    lengthUnit?: string;
    temperatureUnit?: string;
    elapsedRecordField?: boolean;
    mode?: string;
}

export interface FitData {
    protocolVersion: number;
    profileVersion: number;
    file_creator: { software_version: number; },
    records: Record[];
}

export interface Record {
    altitude: number,
    timestamp: Date;
    elapsed_time: number;
    enhanced_altitude: number;
    timer_time: number;
    position_lat: number;
    position_long: number;
    distance: number;
    speed: number;
    heart_rate: number;
    cadence: number;
}