// QuadRenderer.js
import fragmentShaderSrc from "./shaders/fragmentShaderSrc.js";
import vertexShaderSrc from "./shaders/vertexShaderSrc.js";

class QuadRenderer {
    bufAllocated = false;

    constructor(gl, batchSize) {
        this.BATCH_SIZE = batchSize;
        this.gl = gl;
        this.program = this.createProgram();
        this.setupBuffers();
        this.setupUniforms();

        this.batch = this.createEmptyBatch();
        gl.clearColor(0, 0, 0, 1); // Set background color to black
    }

    createEmptyBatch() {
        const size = this.BATCH_SIZE;
        // Each quad has 6 vertices.  Each vertex has:
        // - 2 floats for position (x, y)
        // - 1 float for fog factor
        // - 3 floats for color (r, g, b)
        // Total: 6 floats per vertex * 6 vertices per quad = 36 floats per quad.
        return {
            count: 0,
            vertexData: new Float32Array(size * 6 * 6), // 6 vertices, 6 attributes (pos.xy, fog, color.rgb)
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

    setViewport(w, h) {
        this.gl.useProgram(this.program);
        this.gl.uniform2f(this.uCanvasSize, w, h);
    }

    setupUniforms() {
        const gl = this.gl;
        this.uFog = gl.getUniformLocation(this.program, "uFog");
        this.uCanvasSize = gl.getUniformLocation(this.program, "uCanvasSize");

        this.setViewport(gl.canvas.width, gl.canvas.height);
        gl.uniform3f(this.uFog, 1, 1, 1); // Default white fog (fixed typo)
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

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, 0, gl.DYNAMIC_DRAW); // Initial empty buffer

        const aPosLoc = gl.getAttribLocation(this.program, "aPos");
        const aFogFactorLoc = gl.getAttribLocation(this.program, "aFogFactor");
        const aColorLoc = gl.getAttribLocation(this.program, "aColor");

        // Define the layout of the interleaved data.
        const stride = 6 * Float32Array.BYTES_PER_ELEMENT; // 6 floats per vertex

        // Position attribute
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(aPosLoc, 0); // Important:  This is per-vertex, not per-instance

        // Fog Factor attribute
        gl.enableVertexAttribArray(aFogFactorLoc);
        gl.vertexAttribPointer(aFogFactorLoc, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(aFogFactorLoc, 0);  // Per-vertex

        // Color attribute
        gl.enableVertexAttribArray(aColorLoc);
        gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(aColorLoc, 0);  // Per-vertex

        gl.bindVertexArray(null);
    }


    drawQuad(x1, y1, x2, y2, x3, y3, x4, y4, color = [1, 1, 1], fogFactor = 0.0, light, t) {
        const idx = this.batch.count * 6 * 6; // *6 for vertices, *6 for attributes per vertex

         // Compute the color values for the first vertex
        const temp0 = t > 0 ? (1 - t) * color[0] + t * light[0] : color[0];
        const temp1 = t > 0 ? (1 - t) * color[1] + t * light[1] : color[1];
        const temp2 = t > 0 ? (1 - t) * color[2] + t * light[2] : color[2];

        // Interleaved data for 6 vertices
        const vd = this.batch.vertexData
        let i = idx
        
        // Vertex 1
        vd[i++] = x1; vd[i++] = y1; vd[i++] = fogFactor;
        vd[i++] = temp0; vd[i++] = temp1; vd[i++] = temp2;
        
        // Vertex 2
        vd[i++] = x2; vd[i++] = y2; vd[i++] = fogFactor;
        vd[i++] = temp0; vd[i++] = temp1; vd[i++] = temp2;
        
        // Vertex 3
        vd[i++] = x3; vd[i++] = y3; vd[i++] = fogFactor;
        vd[i++] = temp0; vd[i++] = temp1; vd[i++] = temp2;
        
        // Vertex 4
        vd[i++] = x1; vd[i++] = y1; vd[i++] = fogFactor;
        vd[i++] = temp0; vd[i++] = temp1; vd[i++] = temp2;
        
        // Vertex 5
        vd[i++] = x3; vd[i++] = y3; vd[i++] = fogFactor;
        vd[i++] = temp0; vd[i++] = temp1; vd[i++] = temp2;
        
        // Vertex 6
        vd[i++] = x4; vd[i++] = y4; vd[i++] = fogFactor;
        vd[i++] = temp0; vd[i++] = temp1; vd[i++] = temp2;
        
        this.batch.count++;

        if (this.batch.count >= this.BATCH_SIZE) {
            this.flush();
        }
    }


    uploadInstanceData(firstTime = false) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        if (firstTime) {
            gl.bufferData(gl.ARRAY_BUFFER, this.batch.vertexData.byteLength, gl.DYNAMIC_DRAW);
        }
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.batch.vertexData.subarray(0, this.batch.count * 6 * 6)); // upload only the used part of the buffer
    }



    flush() {
        if (this.batch.count === 0) return;

        const gl = this.gl;
        gl.useProgram(this.program);

        this.uploadInstanceData(!this.bufAllocated);
        if (!this.bufAllocated) this.bufAllocated = true;
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.batch.count * 6); // Draw count * 6 vertices
        gl.bindVertexArray(null);
        this.resetBatch();
    }
}

export default QuadRenderer;