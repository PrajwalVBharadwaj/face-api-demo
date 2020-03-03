import React from "react";
import * as faceapi from "face-api.js";

class FaceComponent extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();
  constructor(props) {
    super(props);
    this.state = {
      videoStream: null,
      modelsLoaded: false
    };
  }
  componentDidMount() {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        console.log("Successfully got the stream");
        this.videoRef.current.srcObject = stream;
        this.setState({ videoStream: stream });
        this.loadModels();
      })
      .catch(err => {
        console.log(err);
      });
  }

  loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    console.log("All models loaded");
    this.canvasRef.current = faceapi.createCanvasFromMedia(
      this.videoRef.current
    );
    faceapi.matchDimensions(this.canvasRef.current, {
      width: 720,
      height: 560
    });
    this.setState({ modelsLoaded: true });
  };

  startDetection = () => {
    console.log("Starting detection...");
    setInterval(async () => {
      let detection = await faceapi
        .detectAllFaces(
          this.videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();
      let resizedDetections = faceapi.resizeResults(detection, {
        width: 720,
        height: 560
      });
      console.log(resizedDetections);
      this.canvasRef.current
        .getContext("2d")
        .clearRect(
          0,
          0,
          this.canvasRef.current.width,
          this.canvasRef.current.height
        );
      faceapi.draw.drawDetections(this.canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(this.canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceExpressions(
        this.canvasRef.current,
        resizedDetections
      );
    }, 1000);
  };

  render() {
    console.log(this.state.videoStream);
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <video
          autoPlay={true}
          controls={true}
          style={{ width: 720, height: 560 }}
          ref={this.videoRef}
          src={this.state.videoStream}
        />
        <canvas
          style={{ width: 720, height: 560, position: "absolute" }}
          ref={this.canvasRef}
        />
        {this.state.modelsLoaded ? (
          <button onClick={this.startDetection}>Start detection</button>
        ) : null}
      </div>
    );
  }
}

export default FaceComponent;
