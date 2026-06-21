import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function NeonFallback() {
  return (
    <div
      className="fixed top-0 left-0 w-full h-full block"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, #0a1628 0%, #000 40%), " +
          "linear-gradient(135deg, #000 0%, #020d1a 50%, #000510 100%)",
      }}
    >
      {/* Animated neon lines to mimic the shader */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full"
            style={{
              top: `${15 + i * 14}%`,
              background: `linear-gradient(90deg, transparent 0%, ${
                ["#f00", "#0f0", "#00f", "#0ff", "#f0f", "#ff0"][i % 6]
              } 50%, transparent 100%)`,
              animation: `pulse ${2 + i * 0.4}s ease-in-out infinite alternate`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported] = useState(() => isWebGLAvailable());

  const sceneRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.OrthographicCamera | null;
    renderer: THREE.WebGLRenderer | null;
    mesh: THREE.Mesh | null;
    uniforms: Record<string, { value: number | number[] }> | null;
    animationId: number | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  });

  useEffect(() => {
    if (!webglSupported || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const { current: refs } = sceneRef;

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        float d = length(p) * distortion;
        
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
        
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    try {
      refs.scene = new THREE.Scene();
      refs.renderer = new THREE.WebGLRenderer({ canvas });
      refs.renderer.setPixelRatio(window.devicePixelRatio);
      refs.renderer.setClearColor(new THREE.Color(0x000000));

      refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

      refs.uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time: { value: 0.0 },
        xScale: { value: 1.0 },
        yScale: { value: 0.5 },
        distortion: { value: 0.05 },
      };

      const position = [
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0,  1.0, 0.0,
      ];

      const positions = new THREE.BufferAttribute(new Float32Array(position), 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", positions);

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: refs.uniforms,
        side: THREE.DoubleSide,
      });

      refs.mesh = new THREE.Mesh(geometry, material);
      refs.scene.add(refs.mesh);

      const handleResize = () => {
        if (!refs.renderer || !refs.uniforms) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        refs.renderer.setSize(width, height, false);
        (refs.uniforms.resolution as { value: number[] }).value = [width, height];
      };

      const animate = () => {
        if (refs.uniforms) (refs.uniforms.time as { value: number }).value += 0.01;
        if (refs.renderer && refs.scene && refs.camera) {
          refs.renderer.render(refs.scene, refs.camera);
        }
        refs.animationId = requestAnimationFrame(animate);
      };

      handleResize();
      animate();
      window.addEventListener("resize", handleResize);

      return () => {
        if (refs.animationId) cancelAnimationFrame(refs.animationId);
        window.removeEventListener("resize", handleResize);
        if (refs.mesh) {
          refs.scene?.remove(refs.mesh);
          refs.mesh.geometry.dispose();
          if (refs.mesh.material instanceof THREE.Material) {
            refs.mesh.material.dispose();
          }
        }
        refs.renderer?.dispose();
      };
    } catch {
      // WebGL failed at runtime — fallback renders instead
    }
  }, [webglSupported]);

  if (!webglSupported) return <NeonFallback />;

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full block"
    />
  );
}
