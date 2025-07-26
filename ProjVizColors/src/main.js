import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ACESFilmicToneMapping } from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Optional, for smooth interaction

// Example: add a sphere to see reflections
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

camera.position.z = 5;

// === HDR Environment Map ===
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader()
.setPath('/textures/') // adjust to your folder name!
.load('je_gray.hdr', function(texture) {
const envMap = pmremGenerator.fromEquirectangular(texture).texture;
scene.environment = envMap;
scene.background = envMap;

texture.dispose();
pmremGenerator.dispose();
});

// === Load Shadow Texture ===
// === Comprehensive Texture Debugging ===
const textureLoader = new THREE.TextureLoader();

// 1. Basic texture loading with all callbacks
const floorShadowTexture = textureLoader.load(
    '/textures/ShadowBake/FloorShadowTextureInvert.png',
    // onLoad callback
    function(texture) {
        console.log('✅ Texture loaded successfully!');
        console.log('Texture object:', texture);
        console.log('Image dimensions:', texture.image.width + 'x' + texture.image.height);
        console.log('Texture UUID:', texture.uuid);
        console.log('Image source:', texture.image.src);
        
        // Check if image actually loaded
        if (texture.image.complete && texture.image.naturalWidth > 0) {
            console.log('✅ Image data is valid');
        } else {
            console.error('❌ Image data is invalid or empty');
        }
    },
    // onProgress callback
    function(xhr) {
        console.log('Loading texture: ' + (xhr.loaded / xhr.total * 100) + '%');
    },
    // onError callback
    function(error) {
        console.error('❌ Error loading texture:', error);
        console.error('Failed to load: drawing-1.png');
        console.error('Check if file exists and path is correct');
    }
);


const wall1ShadowTexture = textureLoader.load(
    '/textures/ShadowBake/wall1ShadowInvert.png',
    // onLoad callback
    function(texture) {
        console.log('✅ Texture loaded successfully!');
        console.log('Texture object:', texture);
        console.log('Image dimensions:', texture.image.width + 'x' + texture.image.height);
        console.log('Texture UUID:', texture.uuid);
        console.log('Image source:', texture.image.src);
        
        // Check if image actually loaded
        if (texture.image.complete && texture.image.naturalWidth > 0) {
            console.log('✅ Image data is valid');
        } else {
            console.error('❌ Image data is invalid or empty');
        }
    },
    // onProgress callback
    function(xhr) {
        console.log('Loading texture: ' + (xhr.loaded / xhr.total * 100) + '%');
    },
    // onError callback
    function(error) {
        console.error('❌ Error loading texture:', error);
        console.error('Failed to load: drawing-1.png');
        console.error('Check if file exists and path is correct');
    }
);



const uvTexture = textureLoader.load(
    '/textures/ShadowBake/uv_mapper.jpg',
    // onLoad callback
    function(texture) {
        console.log('✅ Texture loaded successfully!');
        console.log('Texture object:', texture);
        console.log('Image dimensions:', texture.image.width + 'x' + texture.image.height);
        console.log('Texture UUID:', texture.uuid);
        console.log('Image source:', texture.image.src);
        
        // Check if image actually loaded
        if (texture.image.complete && texture.image.naturalWidth > 0) {
            console.log('✅ Image data is valid');
        } else {
            console.error('❌ Image data is invalid or empty');
        }
    },
    // onProgress callback
    function(xhr) {
        console.log('Loading texture: ' + (xhr.loaded / xhr.total * 100) + '%');
    },
    // onError callback
    function(error) {
        console.error('❌ Error loading texture:', error);
        console.error('Failed to load: drawing-1.png');
        console.error('Check if file exists and path is correct');
    }
);



const floorShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: floorShadowTexture, // Use the same texture for alpha
  opacity: .5, // Set to 1 for full visibility
  side: THREE.DoubleSide, // Render both sides
  transparent: true,
});

const floorMaterial = new THREE.MeshBasicMaterial({
  color: 0xFFFF00,
  side: THREE.DoubleSide, // Render both sides
});

const wall1ShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: wall1ShadowTexture, // Use the same texture for alpha
  opacity: 1.0, // Set to 1 for full visibility
  side: THREE.DoubleSide, // Render both sides
  transparent: true,
});

// === Load GLTF Model ===
const loader = new GLTFLoader();
loader.load(
  '/models/Scene.glb', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, 0, 0);
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);

var kitchenShadowBaker = null;
loader.load(
  'models/floorShadow.glb', // Path relative to the public folder
  function (gltf) {
    kitchenShadowBaker = gltf.scene;
    scene.add(kitchenShadowBaker);
    kitchenShadowBaker.position.set(0, .032, 0);
    kitchenShadowBaker.scale.set(1, 1, -1);
    assignShadowTexture(); 
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);

loader.load(
  'models/floorShadow.glb', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, .03, 0);
    gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = floorMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);


loader.load(
  'models/wall1.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(-.94, 1.5, 3.935);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, Math.PI, 0); // Rotate to face the camera
    console.log('Wall1 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wall1ShadowMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);



loader.load(
  'models/wall1.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(-.94, 1.5, 3.935);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, Math.PI, 0); // Rotate to face the camera
    console.log('Wall1 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = floorMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);



// === Animation Loop ===
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// === Window Resize Handler ===
window.addEventListener( 'resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});


// === Assign Shadow Texture to Model ===
function assignShadowTexture() {
    if (kitchenShadowBaker) {
        kitchenShadowBaker.traverse((child) => {
            if (child.isMesh) {
                child.material = floorShadowMaterial;
            }
        });
    }
}