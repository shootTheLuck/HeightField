/*jshint esversion: 6 */

import { easing } from "../js/mjs/easing.js";

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();

const box3 = new THREE.Box3();
const vPosition = new THREE.Vector3();
const vNeighbor1 = new THREE.Vector3();
const vNeighbor2 = new THREE.Vector3();
const vNeighbor3 = new THREE.Vector3();
const vNeighbor4 = new THREE.Vector3();
const vNeighbor5 = new THREE.Vector3();
const vNeighbor6 = new THREE.Vector3();
const vCross = new THREE.Vector3();
const vSum = new THREE.Vector3();

function returnZero( x, z ) {
    return 0;
}

class HeightField extends THREE.Mesh {

    constructor( geometry, material, heightFunction ) {

        super( geometry, material );
        this.edgeHeight = null;
        this.userData.isHeightField = true;
        this.isHeightField = true;
        this.infoObject = {
            face: new THREE.Triangle(),
            normal: new THREE.Vector3(),
            height: 0
        };

        if ( heightFunction ) {

            this.heightFunction = heightFunction;
            this.applyHeightFunction( this.heightFunction );

        } else {

            this.heightFunction = returnZero;

        }

    }

    getInfoAt( x, z, matrix ) {

        const positions = this.geometry.getAttribute( "position" );
        const array = this.geometry.index.array;
        const transform = matrix || this.matrix;
        const infoObject = this.infoObject;

        for ( let i = 0; i < array.length; i += 3 ) {

            v1.fromBufferAttribute( positions, array[ i + 0 ] );
            v2.fromBufferAttribute( positions, array[ i + 1 ] );
            v3.fromBufferAttribute( positions, array[ i + 2 ] );

            v1.applyMatrix4( transform );
            v2.applyMatrix4( transform );
            v3.applyMatrix4( transform );

            /// calculate baycentric weights
            /// https://codeplea.com/triangular-interpolation
            const w1 = ( x * ( v3.z - v2.z ) + v2.x * ( z - v3.z ) + v3.x * ( v2.z - z ) ) /
                      ( v1.x * ( v3.z - v2.z ) + v2.x * ( v1.z - v3.z ) + v3.x * ( v2.z - v1.z ) );
            const w2 = - ( x * ( v3.z - v1.z ) + v1.x * ( z - v3.z ) + v3.x * ( v1.z - z ) ) /
                      ( v1.x * ( v3.z - v2.z ) + v2.x * ( v1.z - v3.z ) + v3.x * ( v2.z - v1.z ) );
            const w3 = 1.0 - w1 - w2;

            if ( w1 < 0 || w2 < 0 || w3 < 0 ) {

                continue;

            } else {

                infoObject.face.set( v1, v2, v3 );
                infoObject.face.getNormal( infoObject.normal );
                infoObject.height = w1 * v1.y + w2 * v2.y + w3 * v3.y;
                return infoObject;

            }

        }

    }

    getNormalAt( x, z, matrix ) {

        let info = this.getInfoAt( x, z, matrix );
        if ( info ) {

            return info.normal;

}

}

    testIfVertexOnEdge( x, z ) {

        const params = this.geometry.parameters;
        const halfWidth = params.width / 2;
        const halfHeight = params.height / 2;

        if ( x === halfWidth ||
            x === - halfWidth ||
            z === halfHeight ||
            z === - halfHeight ) {

            return true;

        }

        return false;

    }

    fixEdgeNormals( heightFunction = this.heightFunction ) {

        this.updateMatrixWorld();
        const geometry = this.geometry;

        if ( ! geometry.boundingBox ) {

            geometry.computeBoundingBox();

        }

        box3.copy( geometry.boundingBox );
        box3.applyMatrix4( this.matrix );
        const width = box3.max.x - box3.min.x;
        const stride = width / geometry.parameters.widthSegments;

        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;

        for ( let i = 0; i < positions.length; i += 3 ) {

            const x = positions[ i + 0 ];
            const y = positions[ i + 1 ];
            const z = positions[ i + 2 ];

            if ( this.testIfVertexOnEdge( x, z ) ) {

                continue;

            }

            vPosition.set( x, y, z );
            vPosition.add( this.position );
            vSum.set( 0, 0, 0 );

            const right = vPosition.x + stride;
            const left = vPosition.x - stride;
            const up = vPosition.z - stride;
            const down = vPosition.z + stride;

            //right
            vNeighbor1.set( right, heightFunction( right, vPosition.z ), vPosition.z );
            vNeighbor1.sub( vPosition );

            //down
            vNeighbor2.set( vPosition.x, heightFunction( vPosition.x, down ), down );
            vNeighbor2.sub( vPosition );
            vCross.crossVectors( vNeighbor2, vNeighbor1 );
            vSum.add( vCross );

            //diag left and down
            vNeighbor3.set( left, heightFunction( left, down ), down );
            vNeighbor3.sub( vPosition );
            vCross.crossVectors( vNeighbor3, vNeighbor2 );
            vSum.add( vCross );

            //left
            vNeighbor4.set( left, heightFunction( left, vPosition.z ), vPosition.z );
            vNeighbor4.sub( vPosition );
            vCross.crossVectors( vNeighbor4, vNeighbor3 );
            vSum.add( vCross );

            //up
            vNeighbor5.set( vPosition.x, heightFunction( vPosition.x, up ), up );
            vNeighbor5.sub( vPosition );
            vCross.crossVectors( vNeighbor5, vNeighbor4 );
            vSum.add( vCross );

            //diag right and up
            vNeighbor6.set( right, heightFunction( right, up ), up );
            vNeighbor6.sub( vPosition );
            vCross.crossVectors( vNeighbor6, vNeighbor5 );
            vSum.add( vCross );

            vCross.crossVectors( vNeighbor1, vNeighbor6 );
            vSum.add( vCross );

            vSum.normalize();

            normals[ i + 0 ] = vSum.x;
            normals[ i + 1 ] = vSum.y;
            normals[ i + 2 ] = vSum.z;

        }

    }

    getHeightAt( x, z, matrix ) {

        let info = this.getInfoAt( x, z, matrix );
        if ( info ) {

            return info.height;

        } else {

            return this.getHeightFunctionAt( x, z );

        }

    }

    getHeightFunctionAt( x, z ) {

        return this.heightFunction( x, z );

    }

    clampEdgeHeightSquare( opts = {} ) {

        var defaults = {
            height: 0,
            margin: 1
        };

        let height = typeof opts.height == "number" ? opts.height: defaults.height;
        let margin = typeof opts.margin == "number" ? opts.margin: defaults.margin;

        /* margin can't be less than 1 */
        margin = Math.max( 1, margin );

        let tileWidth = this.geometry.parameters.width;

        let marginStart = tileWidth / 2 - margin;

        let positions = this.geometry.getAttribute( "position" );
        let array = positions.array;

        for ( let i = 0; i < array.length; i ++ ) {

            let absX = Math.abs( positions.getX( i ) );
            let absZ = Math.abs( positions.getZ( i ) );

            let distFromMarginStart = Math.max( absX - marginStart, absZ - marginStart );
            let distFromCorner = Math.sqrt(
                ( absX - marginStart ) * ( absX - marginStart ) +
                ( absZ - marginStart ) * ( absZ - marginStart )
            );

            if ( distFromMarginStart > 0 ) {

                let y = positions.getY( i );
                let newY = 0;

                if ( Math.abs( absX - absZ ) < distFromCorner ) {

                    let amount = Math.min( 1, distFromCorner / margin );
                    newY = THREE.MathUtils.lerp( y, height, amount );

                } else {

                    let amount = Math.min( 1, distFromMarginStart / margin );
                    newY = THREE.MathUtils.lerp( y, height, amount );

                }

                positions.setY( i, newY );

            }

        }

        this.updateGeometry();
        this.edgeHeight = height;

    }

    clampEdgeHeightRound( opts = {} ) {

        var defaults = {
            height: 0,
            margin: 1,
            easingMethod: "linear",
            offsetX: 0,
            offsetZ: 0,
        };

        let height = typeof opts.height == "number" ? opts.height: defaults.height;
        let margin = typeof opts.margin == "number" ? opts.margin: defaults.margin;
        let easingMethod = typeof opts.easingMethod == "string" ? easing[ opts.easingMethod ]: easing[ defaults.easingMethod ];
        let offsetX = typeof opts.offsetX == "number" ? opts.offsetX: defaults.offsetX;
        let offsetZ = typeof opts.offsetZ == "number" ? opts.offsetZ: defaults.offsetZ;

        /* margin can't be less than 1 */
        margin = Math.max( 1, margin );

        let tileWidth = this.geometry.parameters.width;
        let radius = tileWidth / 2 - margin;

        let positions = this.geometry.getAttribute( "position" );
        let array = positions.array;
        let v = new THREE.Vector3();

        for ( let i = 0; i < array.length; i ++ ) {

            v.set( positions.getX( i ), positions.getY( i ), positions.getZ( i ) );
            let dist = Math.sqrt(
                ( v.x - offsetX ) * ( v.x - offsetX ) +
                ( v.z - offsetZ ) * ( v.z - offsetZ )
            );

            if ( dist > radius ) {

                let diff = dist - radius;
                let amount = Math.min( 1, diff / margin );

                // let ease = easing[opts.easing](amount);
                let ease = easingMethod( amount );
                let newY = THREE.MathUtils.lerp( v.y, height, ease );
                positions.setY( i, newY );

            }

        }

        this.updateGeometry();
        this.edgeHeight = height;

    }

    clampEdgeHeightCustom( func, opts = {} ) {

        const defaults = {
            height: 0,
            margin: 1,
            offsetX: 0,
            offsetZ: 0,
        };

        const height = typeof opts.height == "number" ? opts.height: defaults.height;
        const offsetX = typeof opts.offsetX == "number" ? opts.offsetX: defaults.offsetX;
        const offsetZ = typeof opts.offsetZ == "number" ? opts.offsetZ: defaults.offsetZ;
        var margin = typeof opts.margin == "number" ? opts.margin: defaults.margin;

        /* margin can't be less than 1 */
        margin = Math.max( 1, margin );

        const radius = this.geometry.parameters.width / 2 - margin;

        const positions = this.geometry.getAttribute( "position" );
        const array = positions.array;

        for ( let i = 0; i < array.length; i ++ ) {

            v1.set( positions.getX( i ), positions.getY( i ), positions.getZ( i ) );
            const dist = Math.sqrt(
                ( v1.x - offsetX ) * ( v1.x - offsetX ) +
                ( v1.z - offsetZ ) * ( v1.z - offsetZ ) ) + func( v1.x, v1.z );

            if ( dist > radius ) {

                const diff = dist - radius;
                const amount = Math.min( 1, diff / margin );
                const newY = THREE.MathUtils.lerp( v1.y, height, amount );
                positions.setY( i, newY );

            }

        }

        this.updateGeometry();
        this.edgeHeight = height;

    }

    updateGeometry() {

        this.geometry.getAttribute( "position" ).needsUpdate = true;
        this.geometry.computeVertexNormals();

    }

    // does not account for scale or rotation of mesh
    applyHeightFunction( func, position = this.position ) {

        const array = this.geometry.getAttribute( "position" ).array;

        for ( let i = 0; i < array.length; i += 3 ) {

            let x = array[ i + 0 ] + position.x;
            let z = array[ i + 2 ] + position.z;
            array[ i + 1 ] = func( x, z );

        }

        this.updateGeometry();
        this.heightFunction = func;

    }

    applyDiamondSquare( func ) {

        let positions = this.geometry.getAttribute( "position" );
        let segments = this.geometry.parameters.widthSegments;
        let index = 0;
        for ( let i = 0; i <= segments; i ++ ) {

            for ( let j = 0; j <= segments; j ++ ) {

                positions.setY( index, func( j, i ) );
                index ++;

            }

        }

        this.updateGeometry();

    }

    alignEdgeHeight() {

        let positions = this.geometry.getAttribute( "position" );
        let cornerHeight = positions.getY( 0 );
        let diff = this.edgeHeight - cornerHeight;
        let array = positions.array;
        for ( let i = 0; i < array.length; i += 3 ) {

            array[ i + 1 ] += diff;

        }

        this.updateGeometry();

    }

    getGeometryDepth() {

        this.geometry.computeBoundingBox();
        let bbox = this.geometry.boundingBox;
        return bbox.max.y - bbox.min.y;

    }

    setGeometryDepth( depth ) {

        const vExtent = this.getGeometryDepth();
        this.geometry.scale( 1, depth / vExtent, 1 );

        if ( this.edgeHeight !== null ) {

            this.alignEdgeHeight( this.edgeHeight );

        }

        this.updateGeometry();

    }


}

export { HeightField };
