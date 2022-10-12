import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as dat from 'lil-gui'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

// src needed 
// const SPECTOR = require('spectorjs');
// const spector = new SPECTOR.Spector();

// spector.displayUI();

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


const textureLoader = new THREE.TextureLoader();


const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/');


// Loader
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const lightMaterial = new THREE.MeshBasicMaterial({ color: '#00AFFE',  })


loader.load('/models/Scifi/scifi_corridor_web.glb', (gltf) => {
    console.log(gltf);

    textureLoader.load('/baked.jpg', texture => {
        texture.flipY = false;
        texture.encoding = THREE.sRGBEncoding;
        const bakedMaterial = new THREE.MeshBasicMaterial({ map: texture });
        gltf.scene.traverse((child) => {
            if(child.userData.name === 'Cylinder.004' || child.userData.name === 'Circle') {
                child.material = lightMaterial;
            } else {
                child.material = bakedMaterial;
            }
        });
    });

    scene.add(gltf.scene);
}, () => {

}, (error) => {
    console.log(error)
    
});

// /**
//  * Floor
//  */
// const floor = new THREE.Mesh(
//     new THREE.PlaneGeometry(10, 10),
//     new THREE.MeshStandardMaterial({
//         color: '#444444',
//         metalness: 0,
//         roughness: 0.5
//     })
// )
// floor.receiveShadow = true
// floor.rotation.x = - Math.PI * 0.5
// scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(2, 2, 5);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const raycaster = new THREE.Raycaster(camera.position);

const mouse = new THREE.Vector2();
const outlineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true } );
const wireframe = new THREE.Line(new THREE.BufferGeometry(), outlineMaterial);


scene.add(wireframe);

let hoveredItem;

function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

window.addEventListener('pointermove', onPointerMove);

const lineMaterial = new LineMaterial({ color: "aqua", linewidth: 4 });
let edgesLines = new LineSegments2(lineMaterial);
// scene.add(edgesLines);

const tick = () => {
    raycaster.setFromCamera(mouse, camera);
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    controls.update()

    const intersected = raycaster.intersectObjects(scene.children);
    if(intersected.length) {
        const mesh = intersected[0].object;
        const meshName = mesh.userData.name;

        if(meshName !== hoveredItem) {
            wireframe.geometry = mesh.geometry;
            wireframe.visible = true;

            // const edges = new THREE.EdgesGeometry(mesh.geometry);
            // console.log(edges);
            // const lineGeometry = new LineSegmentsGeometry().fromEdgesGeometry(edges);
            // edgesLines.geometry = lineGeometry;
            // edgesLines = new LineSegments2(lineGeometry, lineMaterial);
            // mesh.add(edgesLines);

            // edgesLines.visible = true;

            hoveredItem = meshName;
            console.log(hoveredItem);
        }

    } else {
        edgesLines.visible = false;
        wireframe.visible = false;
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()