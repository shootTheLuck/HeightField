# HeightField
HeightField for Three.js extends THREE.Mesh with convenient methods for
setting contours and getting height at any point.

## How do I use it?
```javascript
// import
import {HeightField} from "./HeightField.js";

// heightField extends THREE.Mesh:
const geometry = new THREE.PlaneGeometry(SIZE, SIZE, 64, 64);
geometry.rotateX(-Math.PI/2);
const material = new THREE.MeshStandardMaterial();
const heightField = new HeightField(geometry, material);
scene.add(heightField);

// apply optional heightFunction:
function applyNoise(x, z) {
    // ...perlin generation etc
    const whatever = 1;
    return whatever;
}
heightField.applyHeightFunction(applyNoise);

const player = {};
player.position = {x: 10, y: 0, z: -10};
var height;

// access the height of any position as required:
// with .getHeightFunctionAt(x, z) (fastest):
height = heightField.getHeightFunctionAt(player.position.x, player.position.z);
player.position.y = height;

// with .getHeightAt(x, z) (slower but typically faster than raycasting):
// height = heightField.getHeightAt(player.position.x, player.position.z);
// player.position.y = height;

// with .getInfoAt(x, z) accesses face information (face triangle and normal) and height at the same time:
// const info = heightField.getInfoAt(player.position.x, player.position.z);
// player.position.y = info.height;
```

