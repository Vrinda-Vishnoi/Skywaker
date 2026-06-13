declare module 'satellite.js' {
  export function twoline2satrec(tle1: string, tle2: string): any;
  export function propagate(satrec: any, time: Date): any;
  export function gstime(time: Date): number;
  export function eciToGeodetic(eci: any, gmst: number): any;
  export function degreesLong(radians: number): number;
  export function degreesLat(radians: number): number;
  export function eciToEcf(eci: any, gmst: number): any;
  export function ecfToLookAngles(observerGd: any, positionEcf: any): any;
  export function degreesToRadians(degrees: number): number;
  export function radiansToDegrees(radians: number): number;
}
