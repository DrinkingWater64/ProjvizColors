import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import * as dat from 'dat.gui';
import { ACESFilmicToneMapping } from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

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
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wall1ShadowTexture = textureLoader.load(
    '/textures/ShadowBake/wall1ShadowInvert.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wall2ShadowTexture = textureLoader.load(
    '/textures/ShadowBake/wall2Shadow.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wall3ShadowTexture = textureLoader.load(
    '/textures/ShadowBake/wall3ShadowInvert.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wall4ShadowTexture = textureLoader.load(
    '/textures/ShadowBake/Wall45Shadow.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const uvTexture = textureLoader.load(
    '/textures/ShadowBake/uv_mapper.jpg',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

// wall textures
const walldiffuse = textureLoader.load(
    '/beige_wall/textures/beige_wall_001_diff_1k.jpg',
    onTextureLoad,
    onTextureProgress,
    onTextureError
); 

const wallnormal = textureLoader.load(
    '/beige_wall/textures/beige_wall_001_nor_gl_1k.jpg',
    onTextureLoad,
    onTextureProgress,
    onTextureError
); 

const wallroughness = textureLoader.load(
    '/beige_wall/textures/beige_wall_001_rough_1k.jpg',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wallAo = textureLoader.load(
    '/beige_wall/textures/beige_wall_001_ao_1k.jpg',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wallDisplacement = textureLoader.load(
    '/beige_wall/textures/beige_wall_001_disp_1k.jpg',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wallTextures = [wallDisplacement,wallAo, wallroughness, wallnormal,walldiffuse];
const setWallTextureTiling = (repeatX = 4, repeatY = 2) => {
  wallTextures.forEach(texture => {
    texture.repeat.set(repeatX, repeatY);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  });
};
setWallTextureTiling();



//  floor material setup
const floorDiffuse = textureLoader.load(
    '/floor/diagonal_parquet_diff_1k.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const floorNormal = textureLoader.load(
    '/floor/diagonal_parquet_nor_gl_1k.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const floorRoughness = textureLoader.load(
    '/floor/diagonal_parquet_rough_1k.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const floorDisplacement = textureLoader.load(
    '/floor/diagonal_parquet_disp_1k.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const floorAo = textureLoader.load(
    '/floor/diagonal_parquet_ao_1k.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const floorTextures = [floorDiffuse, floorNormal, floorRoughness, floorDisplacement, floorAo];
const setFloorTextureTiling = (repeatX = 4, repeatY = 2) => {
  floorTextures.forEach(texture => {
    texture.repeat.set(repeatX, repeatY);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  });
};
setFloorTextureTiling(4, 2); // Set initial tiling values

// === Floor Material ===
const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorDiffuse,
  normalMap: floorNormal,
  roughnessMap: floorRoughness,
  displacementMap: floorDisplacement,
  aoMap: floorAo,
  displacementScale: 0.01, // Adjust as needed
  aoMapIntensity: 1.0, // Adjust ambient occlusion intensity
  roughness: 0.8, // Adjust roughness for better appearance
  metalness: 0.1, // Adjust metalness for better appearance
  side: THREE.DoubleSide, // Render both sides,
  envMapIntensity: .01, // Adjust environment map intensity
}); 


// === Materials ===

const wallMaterial = new THREE.MeshStandardMaterial({
  map: walldiffuse,
  normalMap: wallnormal,
  roughnessMap: wallroughness,
  aoMap: wallAo,
  displacementMap: wallDisplacement,
  displacementScale: 0.01, // Adjust as needed
  aoMapIntensity: 1.0, // Adjust ambient occlusion intensity
  roughness: 0.8, // Adjust roughness for better appearance
  metalness: 0.1, // Adjust metalness for better appearance
  side: THREE.DoubleSide, // Render both sides
  envMapIntensity: .01, // Adjust environment map intensity
});



const floorShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: floorShadowTexture, // Use the same texture for alpha
  opacity: .5, // Set to 1 for full visibility
  side: THREE.DoubleSide, // Render both sides
  transparent: true,
});

const YellowMaterial = new THREE.MeshStandardMaterial({
  color: 0xFFFF00,
  roughness: 0.8, // Adjust roughness for better appearance
  metalness: 0.1, // Adjust metalness for better appearance
  side: THREE.DoubleSide, // Render both sides
});

const RedwMaterial = new THREE.MeshBasicMaterial({
  color: 0xFF0000,
  side: THREE.DoubleSide, // Render both sides
});

const wall1ShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: wall1ShadowTexture, // Use the same texture for alpha
  opacity: 1.0, // Set to 1 for full visibility
  side: THREE.DoubleSide, // Render both sides
  transparent: true,
});

const wall2ShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: wall2ShadowTexture, // Use the same texture for alpha
  opacity: 1.0, // Set to 1 for full visibility
  side: THREE.DoubleSide, // Render both sides
  transparent: true,
});

const wall3ShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: wall3ShadowTexture, // Use the same texture for alpha
  opacity: .4, // Set to 1 for full visibility
  side: THREE.DoubleSide, // Render both sides
  transparent: true,
});

const wall4ShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: wall4ShadowTexture, // Use the same texture for alpha
  opacity: .4, // Set to 1 for full visibility
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
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        // Handle both single material and array of materials
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat && typeof mat.envMapIntensity === 'undefined') {
            mat.envMapIntensity = 1.0; // Set your default value here
          }
        });
      }
    });
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

// === Floor Model ===
loader.load(
  'models/floorShadow.glb', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, .025, 0);
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
            x.material = wallMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);

loader.load(
  'models/wall2.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(7.94, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, Math.PI, 0); // Rotate to face the camera
    console.log('Wall1 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wall2ShadowMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);



loader.load(
  'models/wall2.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(7.943, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, Math.PI, 0); // Rotate to face the camera
    console.log('Wall1 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wallMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);


loader.load(
  'models/wall3.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set( -11.65, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, Math.PI, 0); // Rotate to face the camera
    console.log('Wall3 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wall3ShadowMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);



loader.load(
  'models/wall3.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set( -11.66, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, Math.PI, 0); // Rotate to face the camera
    console.log('Wall3 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wallMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);


loader.load(
  'models/wall4.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set( 0, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, 0, 0); // Rotate to face the camera
    console.log('Wall3 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wall4ShadowMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);

loader.load(
  'models/wall4.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set( 0, 0, -0.01);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.set(0, 0, 0); // Rotate to face the camera
    console.log('Wall3 model loaded successfully');
    console.log('Model object:', gltf.scene);
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wallMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);




animate();

// === Window Resize Handler ===
window.addEventListener( 'resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
});




// === GUI Setup ===
const settings = {
  yellowMaterial: 0xFFFF00,
  redMaterial: 0xFF0000,
  shadowOpacity: 0.5
};

// Create GUI
const gui = new dat.GUI({ width: 300 });

// Materials folder
const materialsFolder = gui.addFolder('Materials');

// Add color controllers
materialsFolder.addColor(settings, 'yellowMaterial').name('Yellow Color').onChange(function(value) {
  wallMaterial.color.set(value);
});

materialsFolder.addColor(settings, 'redMaterial').name('Red Color').onChange(function(value) {
  RedwMaterial.color.set(value);
});

// Shadows folder
const shadowsFolder = gui.addFolder('Shadows');

// Add opacity controller for floor shadow
shadowsFolder.add(settings, 'shadowOpacity', 0, 1, 0.01).name('Floor Shadow Opacity').onChange(function(value) {
  floorShadowMaterial.opacity = value;
});

// Open folders
materialsFolder.open();
shadowsFolder.open();


// Add to GUI
const tilingSettings = {
  repeatX: 4,
  repeatY: 2,
  autoTile: true,
  tilesPerMeter: 1
};

const tilingFolder = gui.addFolder('Wall Textures');

tilingFolder.add(tilingSettings, 'repeatX', 1, 20, 0.5).name('Horizontal Tiles').onChange(value => {
  if (!tilingSettings.autoTile) {
    setWallTextureTiling(value, tilingSettings.repeatY);
  }
});

tilingFolder.add(tilingSettings, 'repeatY', 1, 20, 0.5).name('Vertical Tiles').onChange(value => {
  if (!tilingSettings.autoTile) {
    setWallTextureTiling(tilingSettings.repeatX, value);
  }
});

tilingFolder.add(tilingSettings, 'autoTile').name('Auto-Tile Based on Size');
tilingFolder.add(tilingSettings, 'tilesPerMeter', 0.1, 5, 0.1).name('Tiles Per Meter').onChange(value => {
  if (tilingSettings.autoTile) {
    // Re-apply auto tiling to all wall meshes
    scene.traverse(object => {
      if (object.isMesh && object.material === wallMaterial) {
        setupWallTextureTiling(object, value);
      }
    });
  }
});

tilingFolder.open();

// Function to set up wall texture tiling based on wall dimensions
function setupWallTextureTiling(wallMesh, tilesPerMeter = 1) {
  if (!tilingSettings.autoTile) return;
  
  // Get the size of the wall
  const bbox = new THREE.Box3().setFromObject(wallMesh);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  // Calculate how many tiles to apply
  const repeatX = Math.max(1, Math.round(size.x * tilesPerMeter));
  const repeatY = Math.max(1, Math.round(size.y * tilesPerMeter));
  
  // Apply to textures
  setWallTextureTiling(repeatX, repeatY);
  
  // Update the UI
  tilingSettings.repeatX = repeatX;
  tilingSettings.repeatY = repeatY;
}



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


// === Reusable Texture Load Callback ===
function onTextureLoad(texture) {
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
}

// === Reusable Progress Callback ===
function onTextureProgress(xhr) {
    console.log('Loading texture: ' + (xhr.loaded / xhr.total * 100) + '%');
}

// === Reusable Error Callback ===
function onTextureError(error) {
    console.error('❌ Error loading texture:', error);
    console.error('Failed to load: drawing-1.png');
    console.error('Check if file exists and path is correct');
}



// Environment settings
const environmentSettings = {
  rotation: 3.26,
  intensity: .2,
  exposure: .2
};

// Store the original texture for rotation
let originalEnvTexture = null;
let currentEnvMap = null;

// Function to load HDR environment map
function loadEnvironmentMap(path, callback) {
  new RGBELoader()
    .setPath('/textures/')
    .load(path, function(texture) {
      // Store the original texture
      originalEnvTexture = texture;
      
      // Generate the initial environment map
      currentEnvMap = pmremGenerator.fromEquirectangular(texture).texture;
      
      // Apply to scene
      scene.environment = currentEnvMap;
      scene.background = currentEnvMap;
      
      // Set initial exposure
      renderer.toneMappingExposure = environmentSettings.exposure;
      
      if (callback) callback();
    });
}

// Method 1: Using scene rotation (most performant)
function updateEnvironmentRotation() {
  if (!scene.environment) return;
  
  // Rotate the entire scene's environment mapping
  // This effectively rotates the lighting direction
  scene.rotation.y = environmentSettings.rotation;
  
  // Update exposure
  renderer.toneMappingExposure = environmentSettings.exposure;
}



// Load the environment map
loadEnvironmentMap('je_gray.hdr');

// Add environment controls to GUI
const environmentFolder = gui.addFolder('Environment Lighting');

environmentFolder.add(environmentSettings, 'rotation', 0, Math.PI * 2, 0.01)
  .name('Sun Direction')
  .onChange(updateEnvironmentRotation);

environmentFolder.add(environmentSettings, 'intensity', 0, 3.0, 0.1)
  .name('Environment Intensity')
  .onChange(function(value) {
    if (scene.environment) {
      // Note: Direct intensity control requires custom shader modifications
      // This is a simplified approach using exposure
      environmentSettings.exposure = value;
      renderer.toneMappingExposure = value;
    }
  });

environmentFolder.add(environmentSettings, 'exposure', 0.1, 3.0, 0.1)
  .name('Exposure')
  .onChange(function(value) {
    environmentSettings.exposure = value;
    renderer.toneMappingExposure = value;
  });

environmentFolder.open();

// Clean up function
function dispose() {
  if (originalEnvTexture) {
    originalEnvTexture.dispose();
  }
  if (currentEnvMap) {
    currentEnvMap.dispose();
  }
  pmremGenerator.dispose();
}



//  light settings
const lightSettings = {

  // Ambient Light (Fill light)
  ambientEnabled: true,
  ambientIntensity: 0.3,
  ambientColor: 0x404040,


  // Rect Area Light (Key light)
  rectEnabled: true,
  rectIntensity: 1,
  rectColor: 0xffffff,
  rectWidth: 12,
  rectHeight: 12,
  rectX: 0,
  rectY: 3,
  rectZ: 0
}

// light inint

const lights = {}

lights.ambientLight = new THREE.AmbientLight(lightSettings.ambientColor, lightSettings.ambientIntensity);
lights.ambientLight.visible = lightSettings.ambientEnabled;
scene.add(lights.ambientLight);

function updateAmbientLight() {
  if (!lights.ambientLight) return;
  
  lights.ambientLight.visible = lightSettings.ambientEnabled;
  lights.ambientLight.intensity = lightSettings.ambientIntensity;
  lights.ambientLight.color.setHex(lightSettings.ambientColor);
}


// Rect Area Light (Key light)
RectAreaLightUniformsLib.init();

lights.rectLight = new THREE.RectAreaLight(
  lightSettings.rectColor,
  lightSettings.rectIntensity,
  lightSettings.rectWidth,
  lightSettings.rectHeight
);
lights.rectLight.position.set(lightSettings.rectX, lightSettings.rectY, lightSettings.rectZ);
lights.rectLight.lookAt(0, 0, 0);
lights.rectLight.visible = lightSettings.rectEnabled;
scene.add(lights.rectLight);

// Add helper
const rectLightHelper = new RectAreaLightHelper(lights.rectLight);
scene.add(rectLightHelper);
// Make the helper more visible
rectLightHelper.material.color.set(0xffff00); // Yellow
rectLightHelper.material.transparent = true;
rectLightHelper.material.opacity = 0.7;

console.log('Rect Area Light Helper:', rectLightHelper);


// light gui
const lightingFolder = gui.addFolder('Additional Lighting');
const ambientFolder = lightingFolder.addFolder('Ambient Light (Fill)');
ambientFolder.add(lightSettings, 'ambientEnabled').name('Enable').onChange(updateAmbientLight);
ambientFolder.add(lightSettings, 'ambientIntensity', 0, 10, 0.1).name('Intensity').onChange(updateAmbientLight);
ambientFolder.addColor(lightSettings, 'ambientColor').name('Color').onChange(updateAmbientLight);


lightingFolder.open();
ambientFolder.open();


// === Animation Loop ===
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}


