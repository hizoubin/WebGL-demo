// 顶点着色器 
let VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '}\n';

// 片元着色器
let FSHADER_SOURCE =  
  'precision mediump float;\n' +
  'void main() { \n' +
  ' gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0); \n' +
  '}\n';


let gl, n, canvas, u_MvpMatrix;

let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;
  
let RotationMatrix = new Matrix4();
RotationMatrix.setIdentity();

function main() {
  canvas = document.getElementById("webgl");

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to init the shader");
    return;
  }

  // 顶点数
  n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) { 
    console.log('Failed to get the storage locations of u_MvpMatrix');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  // gl.clearColor(0, 0, 0, 1);

  // gl.clear(gl.COLOR_BUFFER_BIT);   

   canvas.addEventListener('mousedown', handleMouseDown, false);
   document.addEventListener('mouseup', handleMouseUp, false);
   document.addEventListener('mousemove', handleMouseMove, false);

   tick();
}

function tick() {
  drawScene();
  requestAnimationFrame(tick);
}

function drawScene() {
  let mvpMatrix = new Matrix4();

  mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 10);
  mvpMatrix.lookAt(3, 5, 5, 0, 0, 0, 0, 1, 0);
  mvpMatrix.multiply(RotationMatrix);
  // console.log(mvpMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  
  // gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.LINE_LOOP, n, gl.UNSIGNED_SHORT, 0);
}
  
function initVertexBuffers(gl) {
  // 经纬度线数量
  let latitudeBands = 30;
  let longitudeBands = 30;
  let radius = 2;

  let vertexPositionData = [];
  let textureCoordData = [];

    for (let latNumber=0; latNumber <= latitudeBands; latNumber++) {
      let theta = latNumber * Math.PI / latitudeBands;
      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);

      for (let longNumber=0; longNumber <= longitudeBands; longNumber++) {
          let phi = longNumber * 2 * Math.PI / longitudeBands;
          let sinPhi = Math.sin(phi);
          let cosPhi = Math.cos(phi);

          let x = cosPhi * sinTheta;
          let y = cosTheta;
          let z = sinPhi * sinTheta;

          // 纹理坐标
        let u = 1 - (longNumber / longitudeBands);
        let v = 1 - (latNumber / latitudeBands);


        textureCoordData.push(u);
        textureCoordData.push(v);
          vertexPositionData.push(radius * x);
          vertexPositionData.push(radius * y);
          vertexPositionData.push(radius * z);
        }
    }
    
    let vertexColorBuffer = gl.createBuffer();
    if (!vertexColorBuffer) {
      console.log('Failed to create the buffer object of vertexColor');
      return -1;
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  
   // let FSIZE = verticesColor.BYTES_PER_ELEMENT;
  
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
  
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    let indexData = [];
    for (let latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (let longNumber=0; longNumber < longitudeBands; longNumber++) {
            let first = (latNumber * (longitudeBands + 1)) + longNumber;
            let second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    let indexBuffer = gl.createBuffer();
    if(!indexBuffer) {
      console.log('Failed to create the buffer object of index');
      return -1;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
    
    return indexData.length;
  }

function handleMouseDown(e) {
  mouseDown = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

  function handleMouseUp(e) {
    mouseDown = false;
  }

  function handleMouseMove(e) {
    if (!mouseDown) return;
    let newMouseX = e.clientX;
    let newMouseY = e.clientY;

    let deltaX = newMouseX - lastMouseX;
    let deltaY = newMouseY - lastMouseY;

    let newRotationMatrix = new Matrix4();

    newRotationMatrix.setIdentity();
    newRotationMatrix.rotate(deltaX / 10, 0, 1, 0)
    newRotationMatrix.rotate(deltaY / 10, 1, 0, 0)


    RotationMatrix = newRotationMatrix.multiply(RotationMatrix);

    lastMouseX = newMouseX;
    lastMouseY = newMouseY;
  }
