# HeightField
HeightField mesh for Three.js.

## How do I use it?
```javascript
// import
import {HeightField} from "./HeightField.js";

// heightField extends THREE.Mesh:
const geometry = new THREE.PlaneBufferGeometry(SIZE, SIZE, 64, 64);
heightFieldGeometry.rotateX(-Math.PI/2);
const material = new THREE.MeshStandardMaterial();
const heightField = new HeightField(geometry, material);

// apply optional heightFunction:
function applyNoiseHeights(x, z) {
	// ...perlin generation etc
	const whatever = 1;
	return whatever;
}
heightField.applyHeightFunction(getHeightWithNoise);

// access the height of any position as required
const player = {};
player.position = {x: 10, y: 0, z -10};
var height;

// with getHeightFunctionAt (fastest):
height = heightField.getHeightFunctionAt(playerPosition.x, playerPosition.z);
player.position.y = height;

// with getHeightAt (less fast but typically faster than raycasting):
height = heightField.getHeightAt(playerPosition.x, playerPosition.z);
player.position.y = height;

// with getInfoAt accesses face information (face triangle and normal) and height a the same time:
const info = heightField.getInfoAt(playerPosition.x, playerPosition.z);
player.position.y = info.height;
```

