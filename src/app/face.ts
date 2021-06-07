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
        let box = detection.detection.box;
        this.box = box;
        this.angle = this.getAngle(detection.landmarks);
        this.center = { x: box.x + box.width / 2, y: box.y + box.height / 2};
        this.x = -box.width * .9;
        this.width = box.width * 1.8;
        this.setSource(source);
    }

    getAngle(landmarks: FaceLandmarks68): number {
        const jawline = landmarks.getJawOutline()
        const jawLeft = jawline[0];
        const jawRight = jawline.splice(-1)[0];
        const adjacent = jawRight.x - jawLeft.x;
        const opposite = jawRight.y - jawLeft.y;
        return Math.atan2(opposite, adjacent);
    }

    setSource(source: HTMLImageElement) {
        if (source) {
            this.y = -source.height / source.width * this.box.width * .9;
            this.height = source.height / source.width * this.box.width * 1.8;
        } else {
            this.y = -this.box.width * .9;
            this.height = this.box.width * 1.8;
        }
        this.source = source;
        this.flip = false;
    }

    updateSource(source: HTMLImageElement) {
        if (this.source && source) {
            if (this.source.src == source.src) {
                if (this.flip) {
                    source = null;
                } else {
                    this.flip = true;
                    return;
                }
            }
        }
        this.setSource(source);
    }
    
}