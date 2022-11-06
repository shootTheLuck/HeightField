
/*
 * PlaneGeometry constructor code from THREE but oriented with y-axis
 * pointing up (no need to rotateX -Math.PI/2). toJSON method is
 * enhanced to serialize the heights, and fromHeightMap method is a
 * convenient way to generate heights from an image url.
 *
 **/

import * as THREE from "three";

class HeightFieldGeometry extends THREE.BufferGeometry {

    constructor( width = 1, height = width, widthSegments = 1, heightSegments = 1 ) {

        super();

        this.parameters = {
            width: width,
            height: height,
            widthSegments: widthSegments,
            heightSegments: heightSegments
        };

        this.setAttributes();

    }

    setAttributes() {

        const { width, height, widthSegments, heightSegments } = this.parameters;

        const width_half = width / 2;
        const height_half = height / 2;

        const gridX = Math.floor( widthSegments );
        const gridY = Math.floor( heightSegments );

        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;

        const segment_width = width / gridX;
        const segment_height = height / gridY;

        //

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        for ( let iy = 0; iy < gridY1; iy ++ ) {

            const y = iy * segment_height - height_half;

            for ( let ix = 0; ix < gridX1; ix ++ ) {

                const x = ix * segment_width - width_half;

                vertices.push( x, 0, y );

                normals.push( 0, 1, 0 );

                uvs.push( ix / gridX );
                uvs.push( 1 - ( iy / gridY ) );

            }

        }

        for ( let iy = 0; iy < gridY; iy ++ ) {

            for ( let ix = 0; ix < gridX; ix ++ ) {

                const a = ix + gridX1 * iy;
                const b = ix + gridX1 * ( iy + 1 );
                const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
                const d = ( ix + 1 ) + gridX1 * iy;

                indices.push( a, b, d );
                indices.push( b, c, d );

            }

        }

        this.setIndex( indices );
        this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
        return this;
    }


    // adapted from:
    // https://github.com/lukas2/threejs_landscape

    fromHeightMap(url, height) {

        const image = document.createElement("img");
        image.src = url;

        image.addEventListener("error", () => {
            console.error("HeightFieldGeometry: there was a problem loading image '" + url + "'");
        });

        image.addEventListener("load", () => {

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext('2d');
            ctx.drawImage( image, 0, 0, image.width, image.height );

            const data = ctx.getImageData( 0, 0, image.height, image.width ).data;
            const pixels = [];

            for ( let i = 0; i < data.length; i += 4 ) {
                // get the average value of R, G and B.
                pixels.push( ( data[ i ] + data[ i + 1 ] + data[ i + 2 ] ) / 3 );
            }

            const numSegments = image.width - 1;

            this.parameters.widthSegments = numSegments;
            this.parameters.heightSegments = numSegments;

            this.setAttributes();

            /*
             * from lukas2: 'keep in mind, that the plane has more vertices
             * than segments. If there's one segment, there's two vertices, if
             * there's 10 segments, there's 11 vertices, and so forth.
             * The simplest is, if like here you have 100 segments, the image
             * to have 101 pixels. You don't have to worry about
             * "skewing the landscape" then..'
             */

            let positions = this.getAttribute( "position" );
            let array = this.index.array;

            for ( let i = 0; i < array.length; i++ ) {

                const terrainValue = pixels[i] / 255;
                positions.setY( i, terrainValue * height );
            }

            positions.needsUpdate = true;
            this.computeVertexNormals();

        });

        return this;
    }

    toJSON() {
        const data = {
            metadata: {
                version: 4.5,
                type: 'BufferGeometry',
                generator: 'BufferGeometry.toJSON'
            }
        }; // standard BufferGeometry serialization

        data.uuid = this.uuid;
        data.type = this.type;
        if (this.name !== '') data.name = this.name;
        if (Object.keys(this.userData).length > 0) data.userData = this.userData;

        data.data = {
            attributes: {}
        };
        const index = this.index;

        if (index !== null) {
            data.data.index = {
                type: index.array.constructor.name,
                array: Array.prototype.slice.call(index.array)
            };
        }

        const attributes = this.attributes;

        for (let _key in attributes) {
            const attribute = attributes[_key];
            const attributeData = attribute.toJSON(data.data);
            if (attribute.name !== '') attributeData.name = attribute.name;
            data.data.attributes[_key] = attributeData;
        }

        const morphAttributes = {};
        let hasMorphAttributes = false;

        for (let _key2 in this.morphAttributes) {
            const attributeArray = this.morphAttributes[_key2];
            const array = [];

            for (let i = 0, il = attributeArray.length; i < il; i++) {
                const _attribute6 = attributeArray[i];

                const _attributeData = _attribute6.toJSON(data.data);

                if (_attribute6.name !== '') _attributeData.name = _attribute6.name;
                array.push(_attributeData);
            }

            if (array.length > 0) {
                morphAttributes[_key2] = array;
                hasMorphAttributes = true;
            }
        }

        if (hasMorphAttributes) {
            data.data.morphAttributes = morphAttributes;
            data.data.morphTargetsRelative = this.morphTargetsRelative;
        }

        const groups = this.groups;

        if (groups.length > 0) {
            data.data.groups = JSON.parse(JSON.stringify(groups));
        }

        const boundingSphere = this.boundingSphere;

        if (boundingSphere !== null) {
            data.data.boundingSphere = {
                center: boundingSphere.center.toArray(),
                radius: boundingSphere.radius
            };
        }

        return data;
    }

}

export {HeightFieldGeometry};