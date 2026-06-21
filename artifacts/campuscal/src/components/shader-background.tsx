import { Warp } from "@paper-design/shaders-react";

function isWebGLSupported(): boolean {
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

export function ShaderBackground() {
  if (!isWebGLSupported()) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 60%, hsl(180,90%,16%) 0%, hsl(200,100%,9%) 35%, hsl(160,80%,11%) 65%, hsl(170,100%,7%) 100%)",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0">
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={1}
        colors={[
          "hsl(200, 100%, 20%)",
          "hsl(160, 100%, 75%)",
          "hsl(180, 90%, 30%)",
          "hsl(170, 100%, 80%)",
        ]}
      />
    </div>
  );
}
