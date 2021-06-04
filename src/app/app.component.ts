import { Component } from '@angular/core';
import { saveAs } from 'file-saver';
import { Face } from 'src/app/face'

import * as faceapi from 'face-api.js';
import { Box } from 'face-api.js';

var faces : Face[] = null;
var input : HTMLImageElement = null;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'face-mask';

  file: File = null;
  ready: boolean = false;
  confidence: number = 0;
  boxes: Box[] = [];
  canvas: HTMLCanvasElement;
  masks: string[] = ['biden', 'trump', 'bernie', 'npc', 'rage', 'troll', 'shades'];
 

  async ngOnInit() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('assets/models');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri('assets/models');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('assets/models');
    this.ready = true;
  }

  async blockFaces(confidence: number, mask: string) {
    if (this.file) {
      this.hideDownloadButton();
      faces = [];
      this.boxes = [];
      let output = <HTMLCanvasElement>document.getElementById('overlay');
      this.canvas = output;
      let context = output.getContext("2d");
      output.width = 600;
      output.height = 40;
      context.fillStyle = "#FFA500";
      context.fillText("processing...", 10, 10);
      
      let source = this.getMaskSource(mask);
      input = document.createElement("img");
      let url = window.URL.createObjectURL(this.file);
      
      input.src = url;
      faceapi.detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: confidence })).then (
        (detections) => {
          detections.sort((a, b) => {return a.box.area - b.box.area});
          detections.map((d) => this.boxes.push(d.box));
          return detections;
        }
      )
      input.onload = async function () {
        output.width = input.width;
        output.height = input.height;
        await faceapi.detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: confidence })).withFaceLandmarks(true).then(
          (detections) => {
            detections.sort((a, b) => {return a.detection.box.area - b.detection.box.area});
            
            detections.forEach(d => {
              let box = d.detection.box;
              let f = new Face(source, box, d.landmarks);
              faces.push(f);
            });
            //faceapi.draw.drawFaceLandmarks(output, detections);
            //faceapi.draw.drawDetections(output, detections);
            drawMasks();
            return detections;
          }
        );
        let dl = document.getElementById('download');
        dl.hidden = false;
        URL.revokeObjectURL(input.src);
      }
    }
  }

  getMaskSource(mask: string): HTMLImageElement {
    if (mask == 'none') {
      return null;
    }
    let source = document.createElement("img");
    source.src = "assets/images/" + mask + ".png";
    return source;
  }

  toggleSource(i: number, mask: string) {
    let source = this.getMaskSource(mask);
    if(faces) {
      let face = faces[i];
      if (face.source) {
        if (face.source.src.includes(mask)) {
          if (face.flip) {
            face.source = null;
            face.flip = false;
          } else {
            face.flip = true;
          }
        } else {
          face.source = source;
          face.flip = false;
        }
      } else {
        face.source = source;
        face.flip = false;
      }
      drawMasks();
    }
  }

  async handleFileInput(files: FileList, confidence: number, mask: string) {
    if (files) {
      this.hideDownloadButton();
      this.file = files.item(0);
      this.blockFaces(confidence, mask);
    }
  }

  hideDownloadButton() {
    let dl = document.getElementById('download');
    dl.hidden = true;
  }

  exportAsImage() {
    if (this.file == null) {
      return;
    }
    let filetype = this.file.type;
    let filename = "masked_" + this.file.name;
    let output = <HTMLCanvasElement>document.getElementById('overlay');
    var image = output.toDataURL(filetype);
    saveAs(image, filename);
  }
}

function drawMasks() {
  let output = <HTMLCanvasElement>document.getElementById('overlay');
  let context = output.getContext("2d");
  context.drawImage(input, 0, 0);
  context.fillStyle = "#000000";
  faces.forEach(face => {
    if (face.source) {
      context.save();
      context.translate(face.center.x, face.center.y);
      context.rotate(face.angle);
      if (face.flip) {
        context.scale(-1, 1);
      }
      if (face.source) {
        context.drawImage(face.source, face.x, face.y, face.width, face.height);
      }
      context.restore();
    }
  });
}

