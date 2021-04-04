import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

import { TRIANGULATION } from './triangulation';

export function main(tf) {
  // const stats = new Stats();
  // stats.showPanel(0);
  // document.body.prepend(stats.domElement);

  let model, ctx, videoWidth, videoHeight, video, canvas;

  const state = {
    backend: 'webgl',
  };
  const NUM_KEYPOINTS = 468;
  const NUM_IRIS_KEYPOINTS = 5;
  const GREEN = '#32EEDB';
  const RED = '#FF2C35';
  const BLUE = '#157AB3';

  function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  function drawPath(ctx, points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }

    if (closePath) {
      region.closePath();
    }
    ctx.stroke(region);
  }

  // const gui = new dat.GUI();
  // gui.add(state, 'backend', ['webgl', 'cpu']).onChange(async backend => {
  //   await tf.setBackend(backend);
  // });

  async function setupCamera() {
    video = document.getElementById('video');

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user' },
    });
    video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }

  const renderPrediction = async () => {
    // stats.begin();
    tf.profile(async () => {
      const predictions = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: false,
      });
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        predictions.forEach(prediction => {
          const keypoints = prediction.scaledMesh;

          if (state.triangulateMesh) {
            ctx.strokeStyle = GREEN;
            ctx.lineWidth = 0.5;

            for (let i = 0; i < TRIANGULATION.length / 3; i++) {
              const points = [
                TRIANGULATION[i * 3],
                TRIANGULATION[i * 3 + 1],
                TRIANGULATION[i * 3 + 2],
              ].map(index => keypoints[index]);

              drawPath(ctx, points, true);
            }
          } else {
            ctx.fillStyle = GREEN;

            for (let i = 0; i < NUM_KEYPOINTS; i++) {
              const x = keypoints[i][0];
              const y = keypoints[i][1];

              ctx.beginPath();
              ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
              ctx.fill();
            }
          }

          if (keypoints.length > NUM_KEYPOINTS) {
            ctx.strokeStyle = RED;
            ctx.lineWidth = 1;

            const leftCenter = keypoints[NUM_KEYPOINTS];
            const leftDiameterY = distance(
              keypoints[NUM_KEYPOINTS + 4],
              keypoints[NUM_KEYPOINTS + 2],
            );
            const leftDiameterX = distance(
              keypoints[NUM_KEYPOINTS + 3],
              keypoints[NUM_KEYPOINTS + 1],
            );

            ctx.beginPath();
            ctx.ellipse(
              leftCenter[0],
              leftCenter[1],
              leftDiameterX / 2,
              leftDiameterY / 2,
              0,
              0,
              2 * Math.PI,
            );
            ctx.stroke();

            if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
              const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
              const rightDiameterY = distance(
                keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
                keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4],
              );
              const rightDiameterX = distance(
                keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
                keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1],
              );

              ctx.beginPath();
              ctx.ellipse(
                rightCenter[0],
                rightCenter[1],
                rightDiameterX / 2,
                rightDiameterY / 2,
                0,
                0,
                2 * Math.PI,
              );
              ctx.stroke();
            }
          }
        });
      }
    }).then(e => {
      console.log(e.kernelNames);
    });

    // stats.end();

    requestAnimationFrame(renderPrediction);
  };

  const setupPage = async () => {
    await tf.setBackend(state.backend);
    await setupCamera();
    video.play();

    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;
    video.width = videoWidth;
    video.height = videoHeight;

    canvas = document.getElementById('output');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

    model = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      {
        maxFaces: 1,
        shouldLoadIrisModel: false,
        modelUrl: 'https://cdn.static.oppenlab.com/weblf/test/facemesh/model.json',
      },
    );

    renderPrediction();
  };

  setupPage();
}
