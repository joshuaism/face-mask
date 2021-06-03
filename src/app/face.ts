import { Box } from 'face-api.js';

export class Face {
    box: Box;
    source: HTMLImageElement;
    angle: number;
    center: {
        x: number,
        y: number
    };
    x: number;
    y: number;
    width: number;
    height: number;
}