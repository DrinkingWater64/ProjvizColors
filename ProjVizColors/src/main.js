import './style.css';
import './loader.css';
import './loader.js';


import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import * as dat from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// ssr
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass.js';
import { ACESFilmicToneMapping } from 'three';
import { createLoader, setupLoadingManager } from './loader.js';


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);

// Camera setup (static)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.7, 2);
camera.lookAt(0, 2, 0);


// Renderer setup with fixed 1080p resolution
const renderer = new THREE.WebGLRenderer({ antialias: true });
const canvasWidth = 1920;
const canvasHeight = 1080;

renderer.setSize(canvasWidth, canvasHeight);
renderer.domElement.style.width = '100vw';
renderer.domElement.style.height = '100vh';
renderer.domElement.style.objectFit = 'contain';
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambientLight);

// Create plane geometry and material
const planeGeometry = new THREE.PlaneGeometry(10, 7);
const planeMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xFFFF2200,
    side: THREE.DoubleSide 
});

// Create plane mesh
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to lie flat (horizontal)
floor.position.z = 0.
floor.position.x = 0
scene.add(floor);


        // const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        // const cubeMaterial = new THREE.MeshLambertMaterial({ 
        //     color: 0xff4444 // Red color for visibility
        // });
        // const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        // cube.position.set(0, 0.5, 0); // Position above the plane
        // scene.add(cube);



// create wall1
const wallMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x00FF0000,
    side: THREE.DoubleSide 
});

const wall1 = new THREE.Mesh(planeGeometry, wallMaterial);
wall1.position.z = -3

scene.add(wall1)

const testMat = new THREE.MeshLambertMaterial({ 
    color: 0x0000FF00,
    side: THREE.DoubleSide 
});
const wall2 = new THREE.Mesh(planeGeometry, testMat);
wall2.rotation.y = Math.PI / 2
wall2.position.x = -4.8
wall2.position.z = 5
wall2.position.y = 5
scene.add(wall2)


const hudCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const hudScene = new THREE.Scene();


const hudCanvas = document.createElement('canvas');
hudCanvas.width = 512;
hudCanvas.height = 512;
const hudContext = hudCanvas.getContext('2d');

const textureLoader = new THREE.TextureLoader();


const placeholderCanvas = document.createElement('canvas');
placeholderCanvas.width = 512;
placeholderCanvas.height = 512;
const placeholderContext = placeholderCanvas.getContext('2d');

placeholderContext.fillStyle = 'rgba(0, 255, 0, 0.3)';
placeholderContext.fillRect(0, 0, 512, 512);
placeholderContext.strokeStyle = 'rgba(0, 255, 0, 0.8)';
placeholderContext.lineWidth = 2;
placeholderContext.strokeRect(10, 10, 492, 492);
placeholderContext.font = '24px monospace';
placeholderContext.fillStyle = 'rgba(0, 255, 0, 0.9)';
placeholderContext.fillText('LOADING HUD...', 180, 256);


const placeholderTexture = new THREE.CanvasTexture(placeholderCanvas);

// Create HUD material with placeholder
const hudMaterial = new THREE.MeshBasicMaterial({
map: placeholderTexture,
transparent: true,
depthTest: false,
depthWrite: false
});

const hudGeometry = new THREE.PlaneGeometry(2, 2);
const hudMesh = new THREE.Mesh(hudGeometry, hudMaterial);
hudScene.add(hudMesh);

loadHUDTexture('Shadow.png');


// Render function
function animate() {
    requestAnimationFrame(animate);
            
    // Render main scene
    renderer.render(scene, camera);
            
    // Render HUD on top
    renderer.autoClear = false;
    renderer.render(hudScene, hudCamera);
    renderer.autoClear = true;
}

window.addEventListener('resize', () => {
    // Camera aspect ratio stays fixed at 1080p ratio
    // Canvas scaling is handled by CSS
});

// Start the animation loop
animate();




//
function loadHUDTexture(imagePath) {
    textureLoader.load(
        imagePath,
        // Success callback
        function(texture) {
            console.log('HUD texture loaded successfully');
            hudMaterial.map = texture;
            hudMaterial.needsUpdate = true;
        },
        // Progress callback
        function(progress) {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
        // Error callback
        function(error) {
            console.error('Error loading HUD texture:', error);
            console.log('Using placeholder HUD instead');
        }
    );
}