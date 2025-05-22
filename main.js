import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
let canvasPanel;
let isInVR = false;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x505050);

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    10
  );
  camera.position.set(0, 1.6, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Create canvas panel
  const canvasTexture = new THREE.CanvasTexture(createCanvas());
  const panelGeometry = new THREE.PlaneGeometry(3.2, 1.8); // 320x180 scaled up by 0.01
  const panelMaterial = new THREE.MeshBasicMaterial({
    map: canvasTexture,
    side: THREE.DoubleSide, // Make the panel visible from both sides
  });
  canvasPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  canvasPanel.position.set(0, 1.6, -2); // Position the panel in front of the user
  scene.add(canvasPanel);

  // Add some ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Controllers setup
  const controllerModelFactory = new XRControllerModelFactory();

  // Controller 1
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  scene.add(controller1);

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  // Controller 2
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  scene.add(controller2);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  // Raycaster
  raycaster = new THREE.Raycaster();

  // Add controller rays
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    visible: false, // Initially invisible until VR mode is entered
  });

  const line = new THREE.Line(geometry, material);
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  // VR Button
  const enterVRButton = document.getElementById("enterVRButton");
  enterVRButton.addEventListener("click", () => {
    document.body.appendChild(VRButton.createButton(renderer));
    isInVR = true;
    // Make controller rays visible
    controller1.children[0].material.visible = true;
    controller2.children[0].material.visible = true;
  });

  window.addEventListener("resize", onWindowResize, false);
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  const context = canvas.getContext("2d");

  // Fill with a light color
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Add a border
  context.strokeStyle = "#000000";
  context.lineWidth = 2;
  context.strokeRect(0, 0, canvas.width, canvas.height);

  // Add some text to show it's interactive
  context.fillStyle = "#000000";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.fillText("Interactive Canvas", canvas.width / 2, canvas.height / 2);

  return canvas;
}

function onSelectStart(event) {
  if (!isInVR) return;

  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];
    const point = intersection.point;

    // Convert 3D intersection point to 2D canvas coordinates
    const canvasWidth = 320;
    const canvasHeight = 180;
    const panelWidth = 3.2;
    const panelHeight = 1.8;

    // Calculate relative position on the panel
    const localPoint = canvasPanel.worldToLocal(point.clone());
    const x = Math.round(
      ((localPoint.x + panelWidth / 2) / panelWidth) * canvasWidth
    );
    const y = Math.round(
      ((-localPoint.y + panelHeight / 2) / panelHeight) * canvasHeight
    );

    console.log("Canvas clicked at:", x, y);

    // Update canvas texture
    const canvas = canvasPanel.material.map.image;
    const context = canvas.getContext("2d");

    // Draw a dot where the ray intersects
    context.fillStyle = "#ff0000";
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fill();

    // Update the texture
    canvasPanel.material.map.needsUpdate = true;
  }
}

function onSelectEnd(event) {
  // Handle controller select end if needed
}

function getIntersections(controller) {
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  return raycaster.intersectObject(canvasPanel);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}