import fragmentShaderSrc from "./shaders/fragmentShaderSrc";
import vertexShaderSrc from "./shaders/vertexShaderSrc";
const DEFAULT_ANCHOR = { x: 0.5, y: 0.5 }
class TextureRenderer {
    bufAllocated = false;

    constructor(gl, batchSize) {
        this.gl = gl;
        this.BATCH_SIZE = batchSize;
        this.program = this.createProgram();
        this.batch = this.createEmptyBatch();
        this.setupBuffers();
        this.setupUniforms();

        this.image = null;
        this.currentBlendMode = 'Normal';
        this.currentMaskData = null;
        gl.clearColor(0, 0, 0, 1); // Set background color to black
    }

    createEmptyBatch() {
        const size = this.BATCH_SIZE;
        // Interleaved data:  offset (2f), scale (2f), texOffset (2f), texScale (2f), fogFactor (1f), alpha (1f), rotation (1f), anchor (2f) = 13 floats
        return {
            count: 0,
            data: new Float32Array(size * 13),
        };
    }

    resetBatch() {
        this.batch.count = 0;
    }

    createProgram() {
        const gl = this.gl;

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSrc);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
        }

        gl.useProgram(program);
        return program;
    }

    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
        }

        return shader;
    }

    clear() {
        const { gl } = this;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    setupBlending() {
        const gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // Ensure depth testing is disabled if not needed
        gl.disable(gl.DEPTH_TEST);
    }

    setViewport(w, h) {
        this.gl.useProgram(this.program);
        this.gl.uniform2f(this.uCanvasSize, w, h);
    }

    setupUniforms() {
        const gl = this.gl;
        this.uFog = gl.getUniformLocation(this.program, "uFog");
        this.uTint = gl.getUniformLocation(this.program, "uTint");
        this.uCanvasSize = gl.getUniformLocation(this.program, "uCanvasSize");
        this.uBlendMode = gl.getUniformLocation(this.program, "uBlendMode");

        this.uMask = gl.getUniformLocation(this.program, "uMask");
        this.uUseMask = gl.getUniformLocation(this.program, "uUseMask");
        this.uMaskSource = gl.getUniformLocation(this.program, "uMaskSource");
        this.uMaskDest = gl.getUniformLocation(this.program, "uMaskDest");

        this.setViewport(gl.canvas.width, gl.canvas.height);
        gl.uniform3f(this.uFog, 1, 1, 1); // Default white fog
        gl.uniform3f(this.uTint, 0, 0, 0); // Default white fog
        gl.uniform1i(this.uBlendMode, 0); // Default Normal blend
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    set fog(val) {
        this.gl.useProgram(this.program);
        this.gl.uniform3f(this.uFog, ...val);
    }

    setupBuffers() {
        const gl = this.gl;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const positions = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);

        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);

        this.positionBuffer = this.createBuffer(positions, "aPosition", 2);
        this.texCoordBuffer = this.createBuffer(texCoords, "aTexCoord", 2);

        // Create a single interleaved buffer
        this.instanceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.batch.data.byteLength, gl.DYNAMIC_DRAW); // Initial allocation (will be resized later if needed)

        // Set up attribute pointers for interleaved data
        // Stride: 13 floats
        const stride = 13 * Float32Array.BYTES_PER_ELEMENT;
        let offset = 0;
        this.setupInterleavedAttribute("aOffset", 2, stride, offset);
        offset += 2 * 4;
        this.setupInterleavedAttribute("aScale", 2, stride, offset);
        offset += 2 * 4;
        this.setupInterleavedAttribute("aTexOffset", 2, stride, offset);
        offset += 2 * 4;
        this.setupInterleavedAttribute("aTexScale", 2, stride, offset);
        offset += 2 * 4;
        this.setupInterleavedAttribute("aFogFactor", 1, stride, offset);
        offset += 1 * 4;
        this.setupInterleavedAttribute("alpha", 1, stride, offset);
        offset += 1 * 4;
        this.setupInterleavedAttribute("aRotation", 1, stride, offset);
        offset += 1 * 4;
        this.setupInterleavedAttribute("aAnchor", 2, stride, offset);


        gl.bindVertexArray(null);
    }

    createBuffer(data, attribName, size) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        const location = gl.getAttribLocation(this.program, attribName);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);

        return buffer;
    }


    setupInterleavedAttribute(attribName, size, stride, offset) {
        const gl = this.gl;
        const location = gl.getAttribLocation(this.program, attribName);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
        gl.vertexAttribDivisor(location, 1);
    }


    setImage(image) {
        const gl = this.gl;
        this.image = image;

        gl.useProgram(this.program);
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.activeTexture(gl.TEXTURE0);
        const imageLocation = gl.getUniformLocation(this.program, "uImage");
        gl.uniform1i(imageLocation, 0);

        this.imageWidth = image.width;
        this.imageHeight = image.height;
    }

    drawImage(sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, fogFactor = 0.0, alpha = 1, rotation = 0, anchor = DEFAULT_ANCHOR, blendMode = 'Normal', maskData = null) {
        if (!this.image) {
            console.warn("No image set for rendering.");
            return;
        }

        if (blendMode !== this.currentBlendMode) {
            this.flush();
            this.currentBlendMode = blendMode;
        }

        // --- Batch Breaking for Mask ---
        const hasMask = !!maskData;
        const currentHasMask = !!this.currentMaskData;
        let maskChanged = false;

        if (hasMask !== currentHasMask) {
            maskChanged = true;
        } else if (hasMask) {
            const m1 = maskData; const m2 = this.currentMaskData;
            if (m1.source.x !== m2.source.x || m1.source.y !== m2.source.y || m1.source.width !== m2.source.width || m1.source.height !== m2.source.height) maskChanged = true;
            if (!maskChanged && m1.dest && m2.dest) {
                if (m1.dest.x !== m2.dest.x || m1.dest.y !== m2.dest.y || m1.dest.width !== m2.dest.width || m1.dest.height !== m2.dest.height) maskChanged = true;
            } else if (!maskChanged && (!!m1.dest !== !!m2.dest)) maskChanged = true;
        }

        if (maskChanged) {
            this.flush();
            this.currentMaskData = maskData;
        }

        const scaleX = dWidth;
        const scaleY = dHeight;
        const offsetX = dx;
        const offsetY = dy;

        const texScaleX = sWidth / this.imageWidth;
        const texScaleY = sHeight / this.imageHeight;
        const texOffsetX = sx / this.imageWidth;
        const texOffsetY = sy / this.imageHeight;

        const i = this.batch.count++;
        // Stride is 13
        let offset = (i * 13);

        this.batch.data[offset++] = offsetX;
        this.batch.data[offset++] = offsetY;
        this.batch.data[offset++] = scaleX;
        this.batch.data[offset++] = scaleY;
        this.batch.data[offset++] = texOffsetX;
        this.batch.data[offset++] = texOffsetY;
        this.batch.data[offset++] = texScaleX;
        this.batch.data[offset++] = texScaleY;
        this.batch.data[offset++] = fogFactor;
        this.batch.data[offset++] = alpha;
        this.batch.data[offset++] = rotation;
        this.batch.data[offset++] = anchor.x;
        this.batch.data[offset++] = anchor.y;


        if (this.batch.count >= this.BATCH_SIZE) {
            this.flush();
        }
    }

    uploadInstanceData(firstUpload = false) {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);

        if (firstUpload) {
            // Allocate buffer memory (or reallocate if larger buffer is needed).  Important for dynamic batch sizes.
            gl.bufferData(gl.ARRAY_BUFFER, this.batch.data.byteLength, gl.DYNAMIC_DRAW);
        }
        //  update data
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batch.data.subarray(0, this.batch.count * 13)); // Only upload the used portion

    }

    setMask(image) {
        if (this.maskImage !== image) {
            this.flush();
            this.maskImage = image;

            const gl = this.gl;
            if (image) {
                if (!this.maskTexture) {
                    this.maskTexture = gl.createTexture();
                }
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.activeTexture(gl.TEXTURE0);
            }
        }
    }


    flush() {
        if (this.batch.count === 0) return;

        const gl = this.gl;
        gl.useProgram(this.program);
        this.setupBlending();

        // Pass the blend mode to the shader
        // 0 = Normal (Premul), 1 = Screen (Straight/SolidAdditive)
        gl.uniform1i(this.uBlendMode, this.currentBlendMode === 'Screen' ? 1 : 0);

        if (this.currentMaskData && this.maskImage) {
            gl.uniform1i(this.uUseMask, 1);
            const ms = this.currentMaskData.source;
            // Apply half-pixel inset to avoid sampling transparent padding
            const inset = 0.5;
            gl.uniform4f(this.uMaskSource,
                (ms.x + inset) / this.maskImage.width,
                (ms.y + inset) / this.maskImage.height,
                (ms.width - 2 * inset) / this.maskImage.width,
                (ms.height - 2 * inset) / this.maskImage.height);
            const md = this.currentMaskData.dest || { x: 0, y: 0, width: 1, height: 1 };
            gl.uniform4f(this.uMaskDest, md.x, md.y, md.width, md.height);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
            gl.uniform1i(this.uMask, 1);
            gl.activeTexture(gl.TEXTURE0);
        } else {
            gl.uniform1i(this.uUseMask, 0);
        }

        // Bind Mask if exists - REMOVED

        this.uploadInstanceData(!this.bufAllocated);
        if (!this.bufAllocated) this.bufAllocated = true;
        gl.bindVertexArray(this.vao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.batch.count);
        this.gl.bindVertexArray(null);
        this.resetBatch();
    }

    checkForErrors() {
        const gl = this.gl;
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error("WebGL error:", error);
        }
    }
}

export default TextureRenderer;