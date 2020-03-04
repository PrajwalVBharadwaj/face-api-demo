import React from "react";
import * as faceapi from "face-api.js";

class FaceComponent extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();
  constructor(props) {
    super(props);
    this.state = {
      modelsLoaded: false,
      videoStream: null
    };
  }
  componentDidMount() {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        console.log("Successfully got the stream");
        this.videoRef.current.srcObject = stream;
        this.setState({ videoStream: stream }, this.loadModels);
      })
      .catch(err => {
        console.log(err);
      });
  }

  loadModels = async () => {
    let canvasNode = document.getElementById("canvas");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    console.log("All models loaded");
    this.canvasRef.current = faceapi.createCanvasFromMedia(
      this.videoRef.current
    );
    let {
      width,
      height
    } = this.state.videoStream.getVideoTracks()[0].getSettings();
    canvasNode.width = width;
    canvasNode.height = height;
    faceapi.matchDimensions(canvasNode, {
      width: width,
      height: height
    });
    this.setState({ modelsLoaded: true });
  };

  startDetection = () => {
    console.log("Starting detection...");
    let canvasNode = document.getElementById("canvas");
    setInterval(async () => {
      let detection = await faceapi
        .detectAllFaces(
          this.videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();
      let {
        width,
        height
      } = this.state.videoStream.getVideoTracks()[0].getSettings();
      let resizedDetections = faceapi.resizeResults(detection, {
        width: width,
        height: height
      });
      let ctx = canvasNode.getContext("2d").clearRect(0, 0, width, height);

      faceapi.draw.drawDetections(canvasNode, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasNode, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvasNode, resizedDetections);
    }, 100);
  };

  render() {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column"
        }}
      >
        <video
          id="video"
          autoPlay={true}
          controls={true}
          ref={this.videoRef}
          src={this.state.videoStream}
        />
        <canvas
          id="canvas"
          style={{
            position: "absolute"
          }}
          ref={this.canvasRef}
        />
        {this.state.modelsLoaded ? (
          <button
            style={{ height: "25px", position: "absolute", top: "10px" }}
            onClick={this.startDetection}
          >
            Start detection
          </button>
        ) : null}
      </div>
    );
  }
}

export default FaceComponent;
