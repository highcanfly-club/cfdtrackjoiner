export function addEndian(littleEndian: any, bytes: any): number;
export function readRecord(blob: any, messageTypes: any, developerFields: any, startIndex: any, options: any, startDate: any, pausedTime: any): {
    messageType: any;
    nextIndex: any;
    message: {
        elapsed_time: number;
        timer_time: number;
        timestamp: any;
    };
} | {
    messageType: string;
    nextIndex: any;
};
export function getArrayBuffer(buffer: any): ArrayBuffer;
export function calculateCRC(blob: any, start: any, end: any): number;
