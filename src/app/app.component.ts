import { Component } from '@angular/core';
import { saveAs } from 'file-saver';
import { Face } from 'src/app/face'

import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'face-mask';

  file: File = null;
  input : HTMLImageElement = null;
  userMask: HTMLImageElement = null;
  ready: boolean = false;
  canvas: HTMLCanvasElement;
  masks: string[] = ['biden', 'trump', 'bernie', 'npc', 'rage', 'troll', 'shades'];

  faces : Face[] = null;
 
  async ngOnInit() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('assets/models');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri('assets/models');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('assets/models');
    this.ready = true;
  }

  blockFaces(confidence: number, mask: string) {
    if (this.file) {
      this.hideDownloadButton();
      this.faces = [];
      let output = <HTMLCanvasElement>document.getElementById('overlay');
      this.canvas = output;
      let context = output.getContext("2d");
      output.width = 600;
      output.height = 40;
      context.fillStyle = "#FFA500";
      context.fillText("Detecting Faces...", 10, 10);
      
      let source = this.getMaskSource(mask);
      this.input = document.createElement("img");
      let url = window.URL.createObjectURL(this.file)
      this.input.src = url;
      
      faceapi.detectAllFaces(this.input, new faceapi.SsdMobilenetv1Options({ minConfidence: confidence })).withFaceLandmarks(true).then (
        (detections) => {
          output.width = this.input.width;
          output.height = this.input.height;

          detections.sort((a, b) => { return a.detection.box.area - b.detection.box.area });

          detections.forEach(d => {
            let box = d.detection.box;
            let f = new Face(source, d);
            this.faces.push(f);
          });
          //faceapi.draw.drawFaceLandmarks(output, detections);
          //faceapi.draw.drawDetections(output, detections);
          this.drawMasks();
          let dl = document.getElementById('download');
          dl.hidden = false;
          URL.revokeObjectURL(this.input.src);
          return detections;
        }
      )
    }
  }

  getMaskSource(mask: string): HTMLImageElement {
    if (mask == 'none') {
      return null;
    }
    if (mask == "user_source") {
      return this.userMask;
    }
    let source = document.createElement("img");
    source.src = "assets/images/" + mask + ".png";
    return source;
  }

  toggleSource(face: Face, mask: string) {
    let source = this.getMaskSource(mask);
    if(face) {
      face.updateSource(source);
      this.drawMasks();
    }
  }

  handleMaskInput(files: FileList) {
    if (files) {
      this.userMask = document.createElement("img");
      let url = window.URL.createObjectURL(files.item(0));
      this.userMask.src = url;
    }
  }

  handleFileInput(files: FileList, confidence: number, mask: string) {
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

  drawMasks() {
    let output = <HTMLCanvasElement>document.getElementById('overlay');
    let context = output.getContext("2d");
    context.drawImage(this.input, 0, 0);
    context.fillStyle = "#000000";
    this.faces.forEach(face => {
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
}



