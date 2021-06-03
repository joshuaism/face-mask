import { Component } from '@angular/core';
import { saveAs } from 'file-saver';
import { Face } from 'src/app/face'

import * as faceapi from 'face-api.js';

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
 

  async ngOnInit() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('assets/models');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri('assets/models');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('assets/models');
    this.ready = true;
  }

  async blockFaces(confidence: number, mask: string) {
    if (faces != null && this.confidence == confidence) {
      drawMasks(mask);
    } else if (this.file) {
      this.confidence = confidence;
      this.hideDownloadButton();
      let output = <HTMLCanvasElement>document.getElementById('overlay');
      let context = output.getContext("2d");
      output.width = 600;
      output.height = 40;
      context.fillStyle = "#FFA500";
      context.fillText("processing...", 10, 10);
      input = document.createElement("img");
      let url = window.URL.createObjectURL(this.file);
      let source = document.createElement("img");
      source.src = "assets/images/" + mask + ".png";
      input.src = url;
      input.onload = async function () {
        output.width = input.width;
        output.height = input.height;
        const detections = await faceapi.detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: confidence })).withFaceLandmarks(true);
        console.log(detections.length);
        detections.sort((a, b) => {return a.detection.box.area - b.detection.box.area});
        faces = []; 
        detections.forEach(d => {
          let box = d.detection.box;
          let f = new Face();
          f.source = source,
          f.angle = getAngle(d.landmarks),
          f.center = { x: box.x + box.width / 2, y: box.y + box.height / 2};
          f.x = -box.width * .9;
          f.y = -source.height / source.width * box.width * .9;
          f.width = box.width * 1.8;
          f.height = source.height / source.width * box.width * 1.8;
          faces.push(f);
        });
        //faceapi.draw.drawFaceLandmarks(output, detections);
        //faceapi.draw.drawDetections(output, detections);
        let dl = document.getElementById('download');
        dl.hidden = false;
        URL.revokeObjectURL(input.src);
        drawMasks(mask);
      }
    }
  }

  async handleFileInput(files: FileList, confidence: number, mask: string) {
    if (files) {
      this.hideDownloadButton();
      this.file = files.item(0);
      faces = null;
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

function getAngle(landmarks: faceapi.FaceLandmarks68) {
  const jawline = landmarks.getJawOutline()
  const jawLeft = jawline[0];
  const jawRight = jawline.splice(-1)[0];
  const adjacent = jawRight.x - jawLeft.x;
  const opposite = jawRight.y - jawLeft.y;
  return Math.atan2(opposite, adjacent);
}

function drawMasks(mask: String) {
  let output = <HTMLCanvasElement>document.getElementById('overlay');
  let context = output.getContext("2d");
  let source = document.createElement("img");
  source.src = "assets/images/" + mask + ".png";
  context.drawImage(input, 0, 0);
  context.fillStyle = "#000000";
  faces.forEach(face => {
    context.save();
    context.translate(face.center.x, face.center.y);
    context.rotate(face.angle);
    //flip
    //context.scale(-1, 1);
    context.drawImage(source, face.x, face.y, face.width, face.height);
    context.restore();
  });
}

