// Import stylesheets
import './style.css';
import { Matrix4 } from './matrix4';

const vs = `
attribute vec4 a_Position;
attribute vec3 a_Colors;

uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_ModelMatrix;

varying vec3 v_Color;

void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix *u_ModelMatrix * a_Position;
    v_Color = a_Colors;
}
`;

const fs = `
precision mediump float;

varying vec3 v_Color;

void main() {
    gl_FragColor = vec4(v_Color, 1.);
}
`;

function initShaders(gl, vshader, fshader) {
  var program = createProgram(gl, vshader, fshader);
  return program;
}

function createProgram(gl, vshader, fshader) {
  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  var program = gl.createProgram();
  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    var error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}

function loadShader(gl, type, source) {
  var shader = gl.createShader(type);
  if (shader == null) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function run() {
  const canvas = document.querySelector("canvas");
  canvas.height = canvas.clientHeight;
  canvas.width = canvas.clientWidth;
  const gl = canvas.getContext("webgl", { antialias: true });
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  const sgProgram = initShaders(gl, vs, fs);

  gl.useProgram(sgProgram);

  var u_ViewMatrix = gl.getUniformLocation(sgProgram, 'u_ViewMatrix');
  var u_Proj = gl.getUniformLocation(sgProgram, 'u_ProjMatrix');
  var u_model = gl.getUniformLocation(sgProgram, 'u_ModelMatrix');
  var projMatrix = new Matrix4();
  var mvpMatrix = new Matrix4(); 
  mvpMatrix.setLookAt(-4, -2, 10, 40, 20, -100, 0, 1, 0);
  var model = new Matrix4(); 

  
  let angle = 0;
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  const sg = new SG(gl, sgProgram);
  gl.uniformMatrix4fv(u_ViewMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(u_Proj, false, projMatrix.elements);
  
  gl.enable(gl.DEPTH_TEST);

  function draw() {
    model.setRotate(angle, 0, -angle, 0.1);
    gl.uniformMatrix4fv(u_model, false, model.elements);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    sg.draw();
    angle -=  Math.PI /10 ;
    
    requestAnimationFrame(draw);
  }

  draw();
}

class SG {
  constructor(gl, program) {
    this.coords = new Array(54).fill(0);
    this.coords[0] = -2;
    this.coords[1] = -1;
    this.coords[2] = 1;
    this.coords[5] = -2;
    this.coords[6] = 2;
    this.coords[25] =3;
    function split(target) { 
      let temp = [];
      for(let i = 0; i < target.length; i+=54) {
        const ax = target[i];
        const ay = target[i+1];
        const az = target[i+2];
        const bz = target[i+5];
        const cx = target[i+6];
        const oy = target[i+25];
  
        fill(temp, ax, ay, az, (az+bz)/2, (ax + cx ) / 2, (ay+oy)/2);
        fill(temp, ax, ay, (az+bz)/2, bz, (ax + cx ) / 2, (ay+oy)/2);
        fill(temp, (ax + cx ) / 2, ay, az, (az+bz)/2, cx, (ay+oy)/2);
        fill(temp, (ax + cx ) / 2, ay, (az+bz)/2, bz, cx, (ay+oy)/2);
        fill(temp, (ax + (ax + cx ) / 2 ) / 2, (ay+oy)/2, (az+(az+bz)/2)/2, ((az+bz)/2+bz)/2,  ((ax + cx ) / 2 + cx ) / 2, oy);
      }
      return temp;
    }
  function fill(arr, ax, ay, az, bz, cx, oy) {
    arr.push(ax,ay,az, ax, ay, bz, cx, ay, bz);
    arr.push(cx, ay, bz, cx, ay, az, ax, ay,az );
    arr.push(cx, ay, bz, ax, ay, bz,  ax/2 + cx/2, oy, az/2+ bz/2);
    arr.push(cx, ay, az, ax, ay, az, ax/2+ cx/2, oy, az/2+ bz/2);
    arr.push(ax, ay, bz, ax, ay, az, ax/2+cx/2, oy, az/2+ bz/2);
    arr.push(cx, ay, bz, cx, ay, az, ax/2+ cx/2, oy, az/2+bz/2);
  }
    this.coords = (split(split(split(split(split(split(split(this.coords))))))));
    console.log(this.coords.length/54)
    const tempColors = [
      1.0, 0., 0.,  1.0, 0., 0.,  1.0, 0., 0.,  
      1.0, 0., 0.,  1.0, 0., 0.,  1.0, 0., 0.,
      1.0, 0., 1.,  1.0, 0., 1.,  1.0, 0., 1.,   
      0.0, 0., 1.,  0.0, 0., 1.,  0.0, 0., 1.,
      0.0, 1., 1.,  0.0, 1., 1.,  0.0, 1., 1.,
      1.0, 1., 0.,  1.0, 1., 0.,  1.0, 1., 0.,
    ];
    const colors = new Array(this.coords.length);
    for(let i = 0; i < colors.length; i += 54) {
      for(let j = 0; j < 54; j++) {
        colors[i+j] = tempColors[j];
      }
    }
    

    const buffer = gl.createBuffer();
    const cbuffer = gl.createBuffer();
    const position = gl.getAttribLocation(program, "a_Position");
    const colorsAttr = gl.getAttribLocation(program, "a_Colors");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.coords), gl.STATIC_DRAW);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false,0, 0);
    gl.enableVertexAttribArray(position);

    
    gl.bindBuffer(gl.ARRAY_BUFFER, cbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorsAttr, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorsAttr);


    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.draw = () => {
      
      gl.drawArrays(gl.TRIANGLES, 0, this.coords.length / 3);
    };
  }
}

run();