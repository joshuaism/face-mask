import { Box, FaceLandmarks68, WithFaceDetection, WithFaceLandmarks } from 'face-api.js';

export class Face {
    source: HTMLImageElement;
    box: Box;
    angle: number;
    center: {
        x: number,
        y: number
    };
    flip: boolean;
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(source: HTMLImageElement, detection: WithFaceLandmarks<WithFaceDetection<{}>>) {
        this.source = source;
        let box = detection.detection.box;
        this.box = box;
        this.angle = this.getAngle(detection.landmarks);
        this.center = { x: box.x + box.width / 2, y: box.y + box.height / 2};
        this.x = -box.width * .9;
        // assume source image is square for now
        this.y = -box.width * .9; // -source.height / source.width * box.width * .9;
        this.width = box.width * 1.8;
        this.height = box.width * 1.8; // source.height / source.width * box.width * 1.8;     
    }

    getAngle(landmarks: FaceLandmarks68) {
        const jawline = landmarks.getJawOutline()
        const jawLeft = jawline[0];
        const jawRight = jawline.splice(-1)[0];
        const adjacent = jawRight.x - jawLeft.x;
        const opposite = jawRight.y - jawLeft.y;
        return Math.atan2(opposite, adjacent);
      }
}