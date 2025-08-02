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

//stat setup
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

stats.dom.style.position = 'absolute';
stats.dom.style.top = '0px';
stats.dom.style.left = '0px';


// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Optional, for smooth interaction
const cameraSpeedSettings = {
    rotateSpeed: .5,      // Rotation speed
    zoomSpeed: 2.5,        // Zoom speed
    panSpeed: 1.5,         // Pan speed
    enableDamping: true,   // Smooth movement
    dampingFactor: 0.05,   // Damping strength
    autoRotate: false,     // Auto rotation
    autoRotateSpeed: 2.0   // Auto rotate speed
};

controls.rotateSpeed = cameraSpeedSettings.rotateSpeed;
controls.zoomSpeed = cameraSpeedSettings.zoomSpeed;
controls.panSpeed = cameraSpeedSettings.panSpeed;
controls.enableDamping = cameraSpeedSettings.enableDamping;
controls.dampingFactor = cameraSpeedSettings.dampingFactor;
controls.autoRotate = cameraSpeedSettings.autoRotate;
controls.autoRotateSpeed = cameraSpeedSettings.autoRotateSpeed;

// loader setup
const loaderElements = createLoader();

const loadingManager = new THREE.LoadingManager();

setupLoadingManager(loadingManager, loaderElements, {
    onComplete: () => {
        // Start animation loop only after loading
        animate();
        
        // Update GUI after everything is loaded
        updateSurfaceDropdown();
        createSurfaceController();
    }
});

// loading manager settings



// === HDR Environment Map ===
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader(loadingManager)
.setPath('/textures/') // adjust to your folder name!
.load('je_gray.hdr', function(texture) {
const envMap = pmremGenerator.fromEquirectangular(texture).texture;
scene.environment = envMap;
scene.background = envMap;

texture.dispose();
pmremGenerator.dispose();
});


// === Ground Reflector for SSR ===
const groundReflector = new ReflectorForSSRPass(
    new THREE.PlaneGeometry(20, 20),  // Smaller, not 30x30 or 50x50
    {
        clipBias: 0.003,  // Scale up from 0.0003
        textureWidth: window.innerWidth,
        textureHeight: window.innerHeight,
        color: 0x888888,
        useDepthTexture: true,
    }
);
groundReflector.material.depthWrite = false;
groundReflector.rotation.x = -Math.PI / 2;
groundReflector.position.y = 0;  // Just barely above 0
groundReflector.visible = true;  // IMPORTANT: Set to false like in the example
scene.add(groundReflector);
// === Post-processing Setup ===
const composer = new EffectComposer(renderer);
const selects = [];
// Create SSR pass
const ssrPass = new SSRPass({
    renderer,
    scene,
    camera,
    width: window.innerWidth,
    height: window.innerHeight,
    groundReflector: groundReflector,  // Always pass the groundReflector
    selects: selects  // Pass the selects array (start empty)
});

// Configure SSR settings
ssrPass.thickness = 0.18;  // Scale up from 0.018
ssrPass.infiniteThick = false;
ssrPass.maxDistance = 1.0;  // Not 0.1, but not 10 either
ssrPass.opacity = 1;
ssrPass.fresnel = true;
ssrPass.distanceAttenuation = true;
ssrPass.bouncing = true;
ssrPass.blur = true;





// Update SSR pass to use the reflector
ssrPass.groundReflector = groundReflector;



composer.addPass(ssrPass);
composer.addPass(new OutputPass());

// mesh registry

const meshRegistry = {
    walls: [],
    floors: [],
};

let meshIdCounter = 0;

function registerMesh(mesh, type, name) {
    const entry = {
        mesh: mesh,
        name: name,
        type: type,
        id: meshIdCounter++,
        originalMaterial: mesh.material ? mesh.material.clone() : null
    };
    
    if (type === 'wall') {
        meshRegistry.walls.push(entry);
    } else if (type === 'floor') {
        meshRegistry.floors.push(entry);
    }
    
    console.log(`Registered ${type}: ${name}`, mesh);
}

const materialPresets = {
    tile1: {
        name: 'Wood Parquet',
        textures: {
            diffuse: '/floor/diagonal_parquet_diff_1k.png',
            normal: '/floor/diagonal_parquet_nor_gl_1k.png',
            roughness: '/floor/diagonal_parquet_rough_1k.png',
            displacement: '/floor/diagonal_parquet_disp_1k.png',
            ao: '/floor/diagonal_parquet_ao_1k.png'
        },
        defaultTiling: { x: 4, y: 4 }
    },
    tile2: {
        name: 'Beige Wall',
        textures: {
            diffuse: '/beige_wall/textures/beige_wall_001_diff_1k.jpg',
            normal: '/beige_wall/textures/beige_wall_001_nor_gl_1k.jpg',
            roughness: '/beige_wall/textures/beige_wall_001_rough_1k.jpg',
            displacement: '/beige_wall/textures/beige_wall_001_disp_1k.jpg',
            ao: '/beige_wall/textures/beige_wall_001_ao_1k.jpg'
        },
        defaultTiling: { x: 4, y: 4 }
    },
    tile3: {
        name: 'Ceramic Tile',
        textures: {
            diffuse: '/tile3png/tile3.png',
            normal: '/tile3png/tile3Normal.png',
            roughness: '/tile3png/tile3smoothness.png',
            displacement: '/tile3png/tile3Displacement.png',
            ao: '/tile3png/tile3Ao.png'
        },
        defaultTiling: { x: 4, y: 4 }
    },
    tile4: {
            name: 'Plaster Tile',
        textures: {
            diffuse: '/tile4png/tile4.png',
            normal: '/tile4png/tile4Normal.png',
            roughness: '/tile4png/tile4Smoothness.png',
            displacement: '/tile4png/tile4Height.png',
            ao: '/tile4png/tile4Ao.png'
        },
        defaultTiling: { x: 4, y: 4 }
    },
    tile5: {
        name: 'Floral Tile',
        textures: {
            diffuse: '/tile1png/tile1.png',
            normal: '/tile1png/tile1Normal.png',
            roughness: '/tile1png/tile1Smoothness.png',
            displacement: '/tile1png/tile1HeightMap.png',
            ao: '/tile1png/tile1Ao.png'
        },
        defaultTiling: { x: 4, y: 4 }
    }
};

let customTextureCounter = 0;

function createCustomMaterial(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const textureUrl = e.target.result;
            
            // Create a unique key for this custom material
            const customKey = `custom_${customTextureCounter++}`;
            
            // Load the custom texture
            const customDiffuse = textureLoader.load(textureUrl);
            
            // Load other textures from tile3 preset
            const tile3Preset = materialPresets.tile3;
            const loadedTextures = {
                diffuse: customDiffuse,
                normal: textureLoader.load(tile3Preset.textures.normal),
                roughness: textureLoader.load(tile3Preset.textures.roughness),
                displacement: textureLoader.load(tile3Preset.textures.displacement),
                ao: textureLoader.load(tile3Preset.textures.ao)
            };
            
            // Create material using tile3 settings
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: loadedTextures.diffuse,
                normalMap: loadedTextures.normal,
                roughnessMap: loadedTextures.roughness,
                displacementMap: loadedTextures.displacement,
                aoMap: loadedTextures.ao,
                displacementScale: 0.01,
                aoMapIntensity: 1.0,
                roughness: 0.8,
                metalness: 0.1,
                side: THREE.DoubleSide,
                envMapIntensity: 0.01
            });
            
            // Store textures reference in material
            material.userData.textures = loadedTextures;
            material.userData.preset = customKey;
            material.userData.customTexture = true;
            material.userData.textureName = file.name;
            
            // Apply current tiling settings
            Object.values(loadedTextures).forEach(texture => {
                texture.repeat.set(materialEditor.tiling.x, materialEditor.tiling.x);
                texture.rotation = materialEditor.tiling.rotation;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.center.set(0.5, 0.5);
            });
            
            resolve(material);
        };
        
        reader.readAsDataURL(file);
    });
}

// Function to create material from preset
function createMaterialFromPreset(presetKey, color = 0xffffff) {
    const preset = materialPresets[presetKey];
    console.log('Creating material from preset:', presetKey);

    const loadedTextures = {};
    
    // Load all textures for this preset
    for (const [key, path] of Object.entries(preset.textures)) {
        if (path) {
            loadedTextures[key] = textureLoader.load(path);
        }
    }
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
        color: color,
        map: loadedTextures.diffuse || null,
        normalMap: loadedTextures.normal || null,
        roughnessMap: loadedTextures.roughness || null,
        displacementMap: loadedTextures.displacement || null,
        aoMap: loadedTextures.ao || null,
        displacementScale: 0.01,
        aoMapIntensity: 1.0,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
        envMapIntensity: 0.01
    });
    
    // Store textures reference in material for later manipulation
    material.userData.textures = loadedTextures;
    material.userData.preset = presetKey;
    
    return material;
}




// === Load Shadow Texture ===
// === Comprehensive Texture Debugging ===
const textureLoader = new THREE.TextureLoader(loadingManager);

// 1. Basic texture loading with all callbacks
const floorShadowTexture = textureLoader.load(
    '/floorWithTextures/floorShadow2kInvert.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wall1ShadowTexture = textureLoader.load(
    '/floorWithTextures/wall1ShadowTexture2kinvert.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wall2ShadowTexture = textureLoader.load(
    '/floorWithTextures/wall2shadowTextureInvert.png',
    onTextureLoad,
    onTextureProgress,
    onTextureError
);

const wall3ShadowTexture = textureLoader.load(
    '/floorWithTextures/wall3ShadowInvert.png',
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
const setWallTextureTiling = (repeatX = 4, repeatY = 4) => {
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
const setFloorTextureTiling = (repeatX = 4, repeatY = 4) => {
  floorTextures.forEach(texture => {
    texture.repeat.set(repeatX, repeatY);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  });
};
setFloorTextureTiling(4, 4); // Set initial tiling values

// === Floor Material ===
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff, // White color for the floor
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
  alphaTest: 0.01, // Adjust alpha test to control visibility
  opacity: 1, // Set to 1 for full visibility
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
  opacity: .5, // Set to 1 for full visibility
  side: THREE.DoubleSide, // Render both sides
  transparent: true,
});

const wall3ShadowMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000, // White color for the shadow
  alphaMap: wall3ShadowTexture, // Use the same texture for alpha
  opacity: 1, // Set to 1 for full visibility
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

const materialEditor = {
    selectedSurface: 'none',
    selectedMaterial: 'none',
    color: 0xffffff,
    tiling: {
        x: 4,
        rotation: 0
    },
    currentMesh: null
};








const loader = new GLTFLoader(loadingManager);
loader.load(
  '/floorWithTextures/prop.gltf',
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        selects.push(child);
        // Handle both single material and array of materials
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat && typeof mat.envMapIntensity === 'undefined') {
            mat.envMapIntensity = 1.0; // Set your default value here
          }
        });
      }
    });

    console.log('Model loaded successfully#######################################################################################################');
    console.log('Model object:', gltf.scene);
    console.log('selects', ssrPass.selects);
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);

var kitchenShadowBaker = null;
loader.load(
  'floorWithTextures/floorShadow.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, .035, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = floorShadowMaterial;
        }
    })
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
    gltf.scene.position.set(0, -.02, 0);
    let meshCount = 0;
    gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = floorMaterial;

            const meshName = meshCount > 0 ? `Main Floor - Part ${meshCount + 1}` : 'Main Floor';
            registerMesh(x, 'floor', meshName);
            materialEditor.currentMesh = x;
            meshCount++;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);


// todo: work in progress ========Ceiling ===============
loader.load(
  'floorWithTextures/ceilingShadow.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, 1, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = floorShadowMaterial;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);

loader.load(
  'floorWithTextures/ceilingShadow.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(0,1, 0);
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


// === Wall Models ===

// wall 1
 
loader.load(
  'floorWithTextures/wall1shadow.gltf', // Path relative to the public folder
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.position.set(-1.88, 0, 7.887);
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
    let meshCount = 0;
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wallMaterial;

            const meshName = meshCount > 0 ? `Wall - Part ${meshCount + 1}` : 'Wall';
            registerMesh(x, 'wall', meshName);
            meshCount++;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);


// wall 2

loader.load(
  'floorWithTextures/wall2shadow.gltf', // Path relative to the public folder
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
    let meshCount = 0;
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wallMaterial;

            const meshName = meshCount > 0 ? `Wall - Part ${meshCount + 1}` : 'Wall';
            registerMesh(x, 'wall', meshName);
            meshCount++;
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);

// wall 3

loader.load(
  'floorWithTextures/wall3shadow.gltf', // Path relative to the public folder
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
    let meshCount = 0;
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wallMaterial;

            const meshName = meshCount > 0 ? `Wall - Part ${meshCount + 1}` : 'Wall';
            registerMesh(x, 'wall', meshName);
            meshCount++;
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
    let meshCount = 0;
        gltf.scene.traverse( x => {
        if (x.isMesh){
            x.material = wallMaterial;

            const meshName = meshCount > 0 ? `Wall - Part ${meshCount + 1}` : 'Wall';
            registerMesh(x, 'wall', meshName);
            meshCount++;  
        }
    })
  },

  undefined, // onProgress
  function (error) {
    console.error('An error happened', error);
  }
);



// initial values
scene.rotation.set(0, 3.26, 0); // Reset scene rotation
camera.rotation.set(-1.8, 1.13, 1.82); // Reset camera rotation
camera.position.set(3.01, 1.8, -.7); // Reset camera position
renderer.toneMappingExposure = .4;


// === Window Resize Handler ===
window.addEventListener( 'resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

        // Update composer size
    composer.setSize(window.innerWidth, window.innerHeight);

        if (groundReflector) {
        groundReflector.getRenderTarget().setSize(window.innerWidth, window.innerHeight);
        groundReflector.resolution.set(window.innerWidth, window.innerHeight);
    }
});






// Create GUI
const gui = new dat.GUI({ width: 300 });







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

// environmentFolder.open();

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


// === Material Editor Settings ===



const materialEditorFolder = gui.addFolder('Material Editor');

// Material preset selector
const materialOptions = {
    'None': 'none',
    'Wood': 'tile1',
    'Biege': 'tile2',
    'Ceramic': 'tile3',
    'Plaster': 'tile4',
    'Floral': 'tile5',
};

const customTextureInfo = {
    currentTexture: 'None'
};

const customTextureDisplay = materialEditorFolder.add(customTextureInfo, 'currentTexture')
    .name('Custom Texture')
    .listen();
customTextureDisplay.domElement.style.pointerEvents = 'none';



materialEditorFolder.add(materialEditor, 'selectedMaterial', materialOptions)
    .name('Material Type')
    .onChange(value => {
        if (!materialEditor.currentMesh) {
            alert('Please select a surface first!');
            return;
        }
        
        console.log('Selected material:', value);
        // Apply new material
        applyMaterialToMesh(materialEditor.currentMesh, value);
        updateMaterialControls();
        console.log('Material options:', materialOptions, value);
    });



const fileInputHandler = {
    uploadTexture: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!materialEditor.currentMesh) {
                alert('Please select a surface first!');
                return;
            }
            
            // Check if it's an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file!');
                return;
            }
            
            try {
                // Create custom material
                const customMaterial = await createCustomMaterial(file);
                
                // Apply to current mesh
                materialEditor.currentMesh.material = customMaterial;
                materialEditor.currentMesh.material.needsUpdate = true;
                
                // Update material editor state
                materialEditor.selectedMaterial = 'custom';
                
                // Update GUI
                updateMaterialControls();
                
                console.log('Custom texture applied:', file.name);
            } catch (error) {
                console.error('Error loading custom texture:', error);
                alert('Error loading texture. Please try again.');
            }
        };
        
        input.click();
    }
};


materialEditorFolder.add(fileInputHandler, 'uploadTexture').name('📁 Upload Custom Texture');

const surfaceOptions = {
    'none': 'Select a surface...'
};

function updateSurfaceDropdown() {
    // Add walls
    meshRegistry.walls.forEach((entry, index) => {
        surfaceOptions[`wall_${index}`] = `wall_${index}`;
    });
    
    // Add floors
    meshRegistry.floors.forEach((entry, index) => {
        surfaceOptions[`floor_${index}`] = `floor_${index}`;
    });
}

// Surface controller
let surfaceController = null;

function createSurfaceController() {
    // Remove old controller if it exists
    if (surfaceController) {
        materialEditorFolder.remove(surfaceController);
    }
    
    // Create new controller with updated options
    surfaceController = materialEditorFolder.add(materialEditor, 'selectedSurface', surfaceOptions)
        .name('Select Surface')
        .onChange(value => {
            console.log('Selected surface:', value);
            
            if (value === 'none') {
                materialEditor.currentMesh = null;
                return;
            }
            
            // Parse the selection
            const [type, index] = value.split('_');
            let meshEntry;
            
            if (type === 'wall') {
                meshEntry = meshRegistry.walls[parseInt(index)];
            } else if (type === 'floor') {
                meshEntry = meshRegistry.floors[parseInt(index)];
            }
            
            console.log('Found mesh entry:', meshEntry);
            
            if (meshEntry && meshEntry.mesh) {
                materialEditor.currentMesh = meshEntry.mesh;
                
                // Update GUI values based on current material
                if (meshEntry.mesh.material) {
                    // Update preset if it exists
                    if (meshEntry.mesh.material.userData && meshEntry.mesh.material.userData.preset) {
                        materialEditor.selectedMaterial = meshEntry.mesh.material.userData.preset;
                    }
                    
                    // Update color
                    if (meshEntry.mesh.material.color) {
                        materialEditor.color = meshEntry.mesh.material.color.getHex();
                    }
                    
                    // Update tiling from the material's map texture
                    if (meshEntry.mesh.material.map) {
                        materialEditor.tiling.x = meshEntry.mesh.material.map.repeat.x;
                        materialEditor.tiling.rotation = meshEntry.mesh.material.map.rotation || 0;
                    }
                }
                
                // Update controllers
                updateMaterialControls();
            }
            else {
                console.error('Mesh entry not found or invalid');
            }
        });
}

createSurfaceController();

const colorController = materialEditorFolder.addColor(materialEditor, 'color')
    .name('Color')
    .onChange(value => {
        if (materialEditor.currentMesh && materialEditor.currentMesh.material) {
            materialEditor.currentMesh.material.color.setHex(value);
        }
    });


const tilingFolder = materialEditorFolder.addFolder('Texture Tiling');

const tilingXController = tilingFolder.add(materialEditor.tiling, 'x', 0.1, 20, 0.1)
    .name('Tiling')
    .onChange(updateTextureTiling);

// const tilingYController = tilingFolder.add(materialEditor.tiling, 'y', 0.1, 20, 0.1)
//     .name('Tiling Y')
//     .onChange(updateTextureTiling);

const rotationController = tilingFolder.add(materialEditor.tiling, 'rotation', 0, Math.PI * 2, 0.01)
    .name('Rotation')
    .onChange(updateTextureTiling);

// // Reset button
// materialEditorFolder.add({
//     resetMaterial: function() {
//         if (materialEditor.currentMesh) {
//             const entry = findMeshEntry(materialEditor.currentMesh);
//             if (entry && entry.originalMaterial) {
//                 materialEditor.currentMesh.material = entry.originalMaterial.clone();
//                 updateMaterialControls();
//             }
//         }
//     }
// }, 'resetMaterial').name('Reset to Original');



// // Helper functions
function applyMaterialToMesh(mesh, presetKey) {
    // Check if we should keep the current custom material
    if (presetKey === 'custom' && mesh.material && mesh.material.userData.customTexture) {
        // Keep the existing custom material, just update tiling
        updateTextureTiling();
        return;
    }
    
    // Otherwise create new material from preset
    const newMaterial = createMaterialFromPreset(presetKey, materialEditor.color);
    
    // Apply current tiling settings
    if (newMaterial.userData.textures) {
        Object.values(newMaterial.userData.textures).forEach(texture => {
            texture.repeat.set(materialEditor.tiling.x, materialEditor.tiling.x);
            texture.rotation = materialEditor.tiling.rotation;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.center.set(0.5, 0.5);
        });
    }
    
    // Preserve the original material reference
    const entry = findMeshEntry(mesh);
    if (entry && !entry.originalMaterial && mesh.material) {
        entry.originalMaterial = mesh.material.clone();
    }
    
    mesh.material = newMaterial;
    mesh.material.needsUpdate = true;
}

function updateTextureTiling() {
    if (!materialEditor.currentMesh || !materialEditor.currentMesh.material) return;
    
    const material = materialEditor.currentMesh.material;
    
    // Update all texture properties
    const texturesToUpdate = [
        material.map,
        material.normalMap,
        material.roughnessMap,
        material.aoMap,
        material.displacementMap
    ];
    
    texturesToUpdate.forEach(texture => {
        if (texture) {
            texture.repeat.set(materialEditor.tiling.x, materialEditor.tiling.x);
            texture.rotation = materialEditor.tiling.rotation;
            texture.center.set(0.5, 0.5);
            texture.needsUpdate = true;
        }
    });
    
    // Also update userData textures if they exist
    if (material.userData && material.userData.textures) {
        Object.values(material.userData.textures).forEach(texture => {
            texture.repeat.set(materialEditor.tiling.x, materialEditor.tiling.x);
            texture.rotation = materialEditor.tiling.rotation;
            texture.center.set(0.5, 0.5);
            texture.needsUpdate = true;
        });
    }
    
    material.needsUpdate = true;
}


function updateMaterialControls() {
    if (!materialEditor.currentMesh) return;
    
    const material = materialEditor.currentMesh.material;
    
    // Update tiling values if textures exist
    if (material.map) {
        materialEditor.tiling.x = material.map.repeat.x;
        materialEditor.tiling.rotation = material.map.rotation || 0;
    }
    
    // Update GUI displays
    tilingXController.updateDisplay();
    rotationController.updateDisplay();
    // colorController.updateDisplay();


        if (materialEditor.currentMesh && 
        materialEditor.currentMesh.material && 
        materialEditor.currentMesh.material.userData.customTexture) {
        customTextureInfo.currentTexture = materialEditor.currentMesh.material.userData.textureName || 'Custom';
    } else {
        customTextureInfo.currentTexture = 'None';
    }
}

function findMeshEntry(mesh) {
    const allEntries = [...meshRegistry.walls, ...meshRegistry.floors];
    return allEntries.find(entry => entry.mesh === mesh);
}

// Shadows folder
// === GUI Setup ===
const settings = {
  shadowOpacity: 0.5
};


const shadowsFolder = gui.addFolder('Shadows');

// Add opacity controller for floor shadow
shadowsFolder.add(settings, 'shadowOpacity', 0, 1, 0.01).name('Floor Shadow Opacity').onChange(function(value) {
  floorShadowMaterial.opacity = value;
});

// Open folders
shadowsFolder.open();




// Open folders
materialEditorFolder.open();
// tilingFolder.open();

// ssr

// === SSR Settings for GUI ===
const ssrSettings = {
    enableSSR: true,
    groundReflector: true,  // Add this
    thickness: 0.18,
    maxDistance: 1.0,
    opacity: 1,
    blur: true,
    fresnel: true,
    bouncing: true,
    infiniteThick: false,
    showReflector: false,  // ADDED THIS
    reflectorY: 0.026,  
    output: SSRPass.OUTPUT.Default
};

// initial ssr settings
ssrPass.maxDistance = .15
ssrPass.opacity = .38
ssrPass.thickness = .18
groundReflector.opacity = .38

// Add SSR folder to GUI
const ssrFolder = gui.addFolder('Screen Space Reflections');

ssrFolder.add(ssrSettings, 'enableSSR').name('Enable SSR').onChange(value => {
    ssrPass.enabled = value;
});

ssrFolder.add(ssrSettings, 'thickness', 0, 1.0, 0.001).name('Thickness').onChange(value => {
    ssrPass.thickness = value;
});

ssrFolder.add(ssrSettings, 'maxDistance', 0, 5, 0.01).name('Max Distance').onChange(value => {
    ssrPass.maxDistance = value;
    groundReflector.maxDistance = value;
});

ssrFolder.add(ssrSettings, 'opacity', 0, 1, 0.01).name('Opacity').onChange(value => {
    ssrPass.opacity = value;
    if (groundReflector) groundReflector.opacity = value;
});

ssrFolder.add(ssrSettings, 'blur').name('Blur').onChange(value => {
    ssrPass.blur = value;
});

ssrFolder.add(ssrSettings, 'fresnel').name('Fresnel').onChange(value => {
    ssrPass.fresnel = value;
    if (groundReflector) groundReflector.fresnel = value;
});

ssrFolder.add(ssrSettings, 'bouncing').name('Bouncing').onChange(value => {
    ssrPass.bouncing = value;
});

ssrFolder.add(ssrSettings, 'showReflector').name('Show Reflector').onChange(value => {
    if (groundReflector) groundReflector.visible = value;
});


ssrFolder.add(ssrSettings, 'reflectorY', -0.1, 0.5, 0.001).name('Reflector Height').onChange(value => {
    groundReflector.position.y = value;
});


ssrFolder.add(ssrSettings, 'output', {
    'Default': SSRPass.OUTPUT.Default,
    'SSR Only': SSRPass.OUTPUT.SSR,
    'Beauty': SSRPass.OUTPUT.Beauty,
    'Depth': SSRPass.OUTPUT.Depth,
    'Normal': SSRPass.OUTPUT.Normal
}).name('Output Mode').onChange(value => {
    ssrPass.output = value;
});


ssrFolder.add(ssrSettings, 'groundReflector').name('Ground Reflector').onChange(value => {
    if (value) {
        ssrPass.groundReflector = groundReflector;
        ssrPass.selects = selects;
    } else {
        ssrPass.groundReflector = null;
        ssrPass.selects = null;
    }
});


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


// lightingFolder.open();
ambientFolder.open();


// === Animation Loop ===

console.log('meshRegistry', meshRegistry);
function animate() {
    stats.begin();
    requestAnimationFrame(animate);
    controls.update();
    camera.position.y = Math.max(0.5, Math.min(3.5, camera.position.y));
    camera.position.x = Math.max(-3.5, Math.min(5.5, camera.position.x));
    camera.position.z = Math.max(-3.5, Math.min(3.5, camera.position.z));
    composer.render();

    stats.end();
}