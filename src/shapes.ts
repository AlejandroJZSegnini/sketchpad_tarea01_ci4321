import { ATTRIB} from './vendor/ff/ff';
import type { FixedFunction } from './vendor/ff/ff';
export type FF = FixedFunction;

export interface Shape {
  name: string;
  draw(): void;
}

export const SEGMENTS = 64; // máximo permitido por el enunciado

// ---------- Geometría (clip space, z = 0, todo CCW) ----------

const TRIANGLE = new Float32Array([
   0.0,  0.7, 0,
  -0.7, -0.6, 0,
   0.7, -0.6, 0,
]);

const SQUARE_VERTS = new Float32Array([
  -0.5, -0.5, 0, // 0 abajo-izq
   0.5, -0.5, 0, // 1 abajo-der
   0.5,  0.5, 0, // 2 arriba-der
  -0.5,  0.5, 0, // 3 arriba-izq
]);
const SQUARE_INDICES = new Uint16Array([0, 1, 2, 0, 2, 3]);

/** Centro + (n + 1) vértices del borde; el último repite al primero para cerrar el abanico. */
function fanVertices(n: number, radius: number): Float32Array {
  const v = new Float32Array((n + 2) * 3);
  // v[0..2] = centro (0, 0, 0)
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI; // ángulo creciente => antihorario
    v[(i + 1) * 3]     = radius * Math.cos(a);
    v[(i + 1) * 3 + 1] = radius * Math.sin(a);
  }
  return v;
}

// ---------- VAOs (solo ATTRIB.POSITION habilitado) ----------

function createVAO(gl: WebGL2RenderingContext, positions: Float32Array, indices?: Uint16Array): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(ATTRIB.POSITION);
  gl.vertexAttribPointer(ATTRIB.POSITION, 3, gl.FLOAT, false, 0, 0);

  if (indices) {
    // El ELEMENT_ARRAY_BUFFER queda guardado dentro del VAO: no desvincularlo antes del VAO.
    const ebo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }

  gl.bindVertexArray(null);
  return vao;
}

// ---------- Figuras ----------

export function createShapes(gl: WebGL2RenderingContext, ff: FF): Shape[] {
  const triVAO = createVAO(gl, TRIANGLE);
  const sqVAO = createVAO(gl, SQUARE_VERTS, SQUARE_INDICES);
  const hexVAO = createVAO(gl, fanVertices(6, 0.7));
  const circVAO = createVAO(gl, fanVertices(SEGMENTS, 0.7));

  return [
    { name: 'triángulo', draw: () => { gl.bindVertexArray(triVAO); ff.drawArrays(gl.TRIANGLES, 0, 3); } },
    // ASUNCIÓN: ff.drawElements(mode, count, type, offset), igual que gl.drawElements
    { name: 'cuadrado', draw: () => { gl.bindVertexArray(sqVAO); ff.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); } },
    { name: 'hexágono', draw: () => { gl.bindVertexArray(hexVAO); ff.drawArrays(gl.TRIANGLE_FAN, 0, 6 + 2); } },
    { name: 'círculo', draw: () => { gl.bindVertexArray(circVAO); ff.drawArrays(gl.TRIANGLE_FAN, 0, SEGMENTS + 2); } },
  ];
}