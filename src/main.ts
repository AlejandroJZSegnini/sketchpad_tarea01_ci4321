import './style.css';
import { createFixedFunction } from './vendor/ff/ff';
import type { RGB } from './vendor/ff/ff';
import { CANVAS_SIZE, CLEAR_COLOR } from './shared';
import { createShapes } from './shapes';

const COLORS: readonly RGB[] = [
  [1, 0, 0], // rojo
  [0, 1, 0], // verde
  [0, 0, 1], // azul
];

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('WebGL2 is not available.');

const ff = createFixedFunction(gl, { debug: true });

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(...CLEAR_COLOR);

const shapes = createShapes(gl, ff);
let shapeIdx = 0; // triángulo
let colorIdx = 0; // rojo

const render = (): void => {
  gl.clear(gl.COLOR_BUFFER_BIT);
  ff.setColor(COLORS[colorIdx]);
  shapes[shapeIdx].draw();
};

document.getElementById('btn-shape')!.addEventListener('click', () => {
  shapeIdx = (shapeIdx + 1) % shapes.length;
  render();
});
document.getElementById('btn-color')!.addEventListener('click', () => {
  colorIdx = (colorIdx + 1) % COLORS.length;
  render();
});

render();