import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let canvasPanel;
let raycaster;
let isVRMode = false;

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    camera.position.set(0, 1.6, 3);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // VR Button
    document.body.appendChild(VRButton.createButton(renderer));

    // Lights
    scene.add(new THREE.AmbientLight(0x404040));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    // Canvas Panel
    const canvasTexture = new THREE.CanvasTexture(createCanvas());
    const canvasMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture });
    const canvasGeometry = new THREE.PlaneGeometry(0.32, 0.18);
    canvasPanel = new THREE.Mesh(canvasGeometry, canvasMaterial);
    canvasPanel.position.set(0, 1.6, -1);
    scene.add(canvasPanel);

    // Controllers
    const controllerModelFactory = new XRControllerModelFactory();

    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    scene.add(controller1, controller2);

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip1, controllerGrip2);

    // Raycaster
    raycaster = new THREE.Raycaster();

    controller1.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectstart', onSelectStart);

    // VR Session Events
    renderer.xr.addEventListener('sessionstart', () => {
        isVRMode = true;
    });
    renderer.xr.addEventListener('sessionend', () => {
        isVRMode = false;
    });

    window.addEventListener('resize', onWindowResize);
}

function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.fillText('VR Canvas Panel', 10, 30);
    return canvas;
}

function onSelectStart(event) {
    if (!isVRMode) return;

    const controller = event.target;
    const tempMatrix = new THREE.Matrix4().identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = raycaster.intersectObject(canvasPanel);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        const uv = intersect.uv;
        const x = Math.floor(uv.x * 320);
        const y = Math.floor((1 - uv.y) * 180);
        console.log(`Clicked at canvas coordinates: (${x}, ${y})`);
    }
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
    renderer.render(scene, camera);
}
