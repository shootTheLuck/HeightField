
import * as THREE from "three";
import {HeightField} from "./HeightField.js";
import {HeightFieldGeometry} from "./HeightFieldGeometry.js";
import {SimplexNoise} from "./lib/SimplexNoise.js";
import {ViewControls} from "https://shootTheLuck.github.io/ViewControls/ViewControls.js";

const SIZE = 1000;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200000);
camera.position.set(0, SIZE * 0.3, SIZE * 0.6);
camera.lookAt(scene.position);

scene.add(new THREE.AmbientLight(0xffffff, 0.2));

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(-SIZE/2, SIZE/4, 0);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 2056;
directionalLight.shadow.mapSize.height = 2056;

const shadowCamDimension = 1000;
directionalLight.shadow.camera.far = 200000;
directionalLight.shadow.camera.left = -shadowCamDimension;
directionalLight.shadow.camera.right = shadowCamDimension;
directionalLight.shadow.camera.bottom = -shadowCamDimension;
directionalLight.shadow.camera.top = shadowCamDimension;

directionalLight.shadow.camera.updateProjectionMatrix();

scene.add(directionalLight);

const viewControls = new ViewControls(camera, scene, renderer.domElement);

////////////////////////////   HeightField   //////////////////////////////

const simplex = new SimplexNoise();

function getHeightWithNoise(x, z) {
    // adding 1 here to make value always positive
    const frequency = 5;
    let value1 = simplex.noise(x * frequency / SIZE, z * frequency / SIZE) + 1;
    return Math.pow(value1, 3.0) * SIZE/100;
}

function getCoastWithNoise(x, z) {
    // adding 1 here to make value always positive
    const frequency = 15;
    let value1 = simplex.noise(x * frequency / SIZE, z * frequency / SIZE) + 1;
    return Math.pow(value1, 3.0) * SIZE/100;
}

const heightFieldGeometry = new HeightFieldGeometry(SIZE, SIZE, 64, 64);
const heightFieldMaterial = new THREE.MeshStandardMaterial();
const heightField = new HeightField(heightFieldGeometry, heightFieldMaterial);

heightField.applyHeightFunction(getHeightWithNoise);
heightField.clampEdgeHeightSquare({margin: 200, height: -50});
// heightField.clampEdgeHeightRound({margin: 200, height: -50});
// heightField.clampEdgeHeightCustom(getCoastWithNoise, {margin: 200, height: -50});
scene.add(heightField);
heightField.receiveShadow = true;

////////////////////////////   end HeightField   //////////////////////////////

const water = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.97,
        color: 0x112244
    })
);
water.position.y = -1;
scene.add(water);

const markerRadius = SIZE/150;
const marker = new THREE.Mesh(
    new THREE.SphereGeometry(markerRadius),
    new THREE.MeshStandardMaterial({color: 0xff0000})
);
marker.geometry.translate(0, markerRadius/2, 0);
marker.castShadow = true;

marker.update = function(timer) {
    this.position.x = Math.sin(timer/2000) * SIZE/4;
    this.position.z = Math.cos(timer/2000) * SIZE/4;

    // this.position.y = heightField.getHeightAt(this.position.x, this.position.z);
    const info = heightField.getInfoAt(this.position.x, this.position.z);
    this.position.y = info.height;
}

scene.add(marker);

function animate(timeStamp) {
    marker.update(timeStamp);
    viewControls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate(0);

function setDisplaySize(width, height) {
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize", () => {
    setDisplaySize(window.innerWidth, window.innerHeight);
});
