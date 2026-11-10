import { FEATURES } from './data.js';

const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform sampler2D u_surface;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_zoom;
void main() {
  vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / (min(u_resolution.x, u_resolution.y) * 0.405 * u_zoom);
  float dist = dot(p, p);
  if (dist >= 1.0) discard;
  vec3 view = vec3(p, sqrt(1.0 - dist));
  float cp = cos(u_pitch), sp = sin(u_pitch);
  float cy = cos(u_yaw), sy = sin(u_yaw);
  float worldY = view.y * cp + view.z * sp;
  float tempZ = -view.y * sp + view.z * cp;
  float worldX = view.x * cy + tempZ * sy;
  float worldZ = -view.x * sy + tempZ * cy;
  float longitude = atan(worldX, worldZ);
  float latitude = asin(clamp(worldY, -1.0, 1.0));
  vec2 uv = vec2(fract(longitude / 6.28318530718 + 0.5), 0.5 - latitude / 3.14159265359);
  vec3 surface = texture2D(u_surface, uv).rgb;
  float diffuse = clamp(dot(view, normalize(vec3(-0.32, 0.33, 0.89))), 0.0, 1.0);
  float edge = smoothstep(0.0, 0.035, 1.0 - dist);
  vec3 result = surface * (0.30 + 0.75 * diffuse);
  gl_FragColor = vec4(result, edge);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export function createGlobe({ canvas, markers, onSelect }) {
  let gl;
  let program;
  const state = { yaw: 0, pitch: .07, zoom: 1, filter: 'all', active: 'apollo11' };
  const markerButtons = new Map();
  let lastX = 0, lastY = 0, dragging = false, pending = false;

  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL indisponível');
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([155,160,170,255]));
    const textureImage = new Image();
    textureImage.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage);
      gl.uniform1i(gl.getUniformLocation(program, 'u_surface'), 0);
      draw();
    };
    textureImage.src = './assets/moon-surface.webp';
  } catch (error) {
    canvas.classList.add('globe-fallback');
    canvas.setAttribute('aria-label', 'Representação lunar ilustrativa; WebGL não está disponível neste navegador.');
  }

  const createMarkers = () => {
    for (const place of FEATURES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'surface-pin';
      b.innerHTML = `<span class="pin-dot"></span><span class="pin-name"></span>`;
      b.querySelector('.pin-name').textContent = place.name;
      b.setAttribute('aria-label', `Explorar ${place.name}`);
      b.addEventListener('click', () => {
        state.active = place.id;
        onSelect(place);
        updateMarkers();
      });
      markers.append(b);
      markerButtons.set(place.id, b);
    }
  };

  function updateMarkers() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const radius = Math.min(w,h) * .405 * state.zoom;
    const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
    const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
    for (const place of FEATURES) {
      const b = markerButtons.get(place.id);
      const lon = place.lon * Math.PI / 180;
      const lat = place.lat * Math.PI / 180;
      const x = Math.cos(lat) * Math.sin(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon);
      const rX = x * cy - z * sy;
      const rZ = x * sy + z * cy;
      const pY = y * cp - rZ * sp;
      const pZ = y * sp + rZ * cp;
      const visible = pZ > .15 && (state.filter === 'all' || state.filter === place.type);
      b.hidden = !visible;
      b.classList.toggle('active', state.active === place.id);
      b.style.left = `${w / 2 + rX * radius}px`;
      b.style.top = `${h / 2 - pY * radius}px`;
    }
  }

  function draw() {
    pending = false;
    if (gl && program) {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);
      if (width && height && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, 'u_yaw'), state.yaw);
      gl.uniform1f(gl.getUniformLocation(program, 'u_pitch'), state.pitch);
      gl.uniform1f(gl.getUniformLocation(program, 'u_zoom'), state.zoom);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    updateMarkers();
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(draw);
  }

  function move(event) {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    state.yaw -= dx * .008;
    state.pitch = Math.max(-1.15, Math.min(1.15, state.pitch + dy * .006));
    lastX = event.clientX;
    lastY = event.clientY;
    schedule();
  }
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('keydown', (e) => {
    const actions = { ArrowLeft: [-.15,0], ArrowRight:[.15,0], ArrowUp:[0,-.12], ArrowDown:[0,.12] };
    if (!actions[e.key]) return;
    e.preventDefault();
    state.yaw += actions[e.key][0];
    state.pitch = Math.max(-1.15,Math.min(1.15,state.pitch+actions[e.key][1]));
    schedule();
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    state.zoom = Math.max(.75, Math.min(1.45, state.zoom - Math.sign(event.deltaY) * .075));
    schedule();
  }, { passive: false });
  window.addEventListener('resize', schedule);
  createMarkers();
  schedule();
  return {
    setFilter: filter => { state.filter = filter; schedule(); },
    zoom: delta => { state.zoom = Math.max(.75, Math.min(1.45, state.zoom + delta)); schedule(); },
    reset: () => { state.yaw = 0; state.pitch = .07; state.zoom = 1; schedule(); },
    focus: place => { state.active = place.id; state.yaw = place.lon * Math.PI / 180; state.pitch = place.lat * Math.PI / 180; schedule(); onSelect(place); },
    getState: () => ({ ...state })
  };
}
