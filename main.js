
import {HeightField} from "./HeightField.js";
import {SimplexNoise} from "./lib/SimplexNoise.js";
import {ViewControls} from "https://shootTheLuck.github.io/View-Controls/ViewControls.js";

const SIZE = 1000;

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
renderer.shadowMapEnabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200000);
camera.position.set(0, SIZE * 0.4, SIZE * 0.8);
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

// const noise = new Noise();
const simplex = new SimplexNoise();
// noise.seed(8);

function getHeightWithNoise(x, z) {
    // adding 1 here to make value always positive
    // let value1 = noise.simplex2(x/1400, z/1400) + 1 ;
    const frequency = 5;
    let value1 = simplex.noise(x * frequency / SIZE, z * frequency / SIZE) + 1 ;
    return Math.pow(value1, 3.0) * SIZE/100;
}

const getHeightWithNoiseNO = (function() {

    const settings = {
        seed: 8,
        scale: 3000, //higher is more spread out
        octaves: 6,
        persistence: 0.5,
        lacunarity: 1.75,
        exponentiation: 1,
        offsetX: 0,
        height: 800,
    }

    // const noise = new Noise();
    const simplex = new SimplexNoise();
    // noise.seed(settings.seed);

    return function(x, z, rounding = 0) {
        let xs = x;
        let zs = z;

        if (rounding > 0) {
            // xs = MathUtils.roundToNearest(xs, rounding);
            // zs = MathUtils.roundToNearest(zs, rounding);
            xs = Math.round(xs/ rounding) * rounding;
            zs = Math.round(zs/ rounding) * rounding;
        }
        xs /= settings.scale;
        zs /= settings.scale;

        var frequency = 1;
        var amplitude = 1;
        var normalization = 0;
        var total = 0;

        for (let i = 0; i < settings.octaves; i ++) {
            var amount = simplex.noise(xs * frequency, zs * frequency) + 0 ;
            // amount = amount * 0.5 + 0.5;
            total += amount * amplitude;
            normalization += amplitude;
            frequency *= settings.lacunarity;
            amplitude *= settings.persistence;
        }

        total /= normalization;
        total = Math.pow(total, settings.exponentiation);
        total *= settings.height;
        return total;
    }
})();

function getCoastWithNoise(x, z) {
    // adding 1 here to make value always positive
    // let value1 = noise.simplex2(x/2000, z/1200) + 1;
    const frequency = 15;
    let value1 = simplex.noise(x * frequency / SIZE, z * frequency / SIZE) + 1 ;
    return Math.pow(value1, 3.0) * SIZE/100;
}

const heightFieldGeometry = new THREE.PlaneBufferGeometry(SIZE, SIZE, 64, 64);
heightFieldGeometry.rotateX(-Math.PI/2);

const heightFieldMaterial = new THREE.MeshStandardMaterial();

const heightField = new HeightField(heightFieldGeometry, heightFieldMaterial);

heightField.applyHeightFunction(getHeightWithNoise);
// heightField.setGeometryDepth(height);
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

const marker = new THREE.Mesh(
    new THREE.SphereGeometry(SIZE/200),
    new THREE.MeshStandardMaterial({color: 0xff0000})
);
marker.castShadow = true;

marker.update = function() {
    const now = Date.now();
    this.position.x = Math.sin(now/2000) * SIZE/4;
    this.position.z = Math.cos(now/2000) * SIZE/4;
    // this.position.y = heightField.getHeightAt(this.position.x, this.position.z) + SIZE/201;
    const info = heightField.getInfoAt(this.position.x, this.position.z);
    this.position.y = info.height + SIZE/201;
    // this.position.y = heightField.getInfoAt(this.position.x, this.position.z) + SIZE/201;
}

scene.add(marker);
marker.update();

function onWindowResize() {
    updateRendererSize(window.innerWidth, window.innerHeight);
}

function updateRendererSize(width, height) {
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', onWindowResize);

function animate(timeStamp) {
    marker.update();
    viewControls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}


animate();
