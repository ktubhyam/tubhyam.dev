import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Normal Mode Explorer — Interactive 3D Molecular Vibration Visualization";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #030308 0%, #0a0a1a 40%, #0d0d2a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.06,
            backgroundImage:
              "linear-gradient(rgba(0,216,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,216,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,216,255,0.08) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />

        {/* Molecule illustration */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
            position: "relative",
          }}
        >
          {/* Central atom */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #4DE8FF, #00D8FF, #0099B3)",
              boxShadow: "0 0 40px rgba(0,216,255,0.4), 0 0 80px rgba(0,216,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 2,
            }}
          />

          {/* Left bond + atom */}
          <div
            style={{
              position: "absolute",
              left: "-120px",
              top: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #FF6666, #FF0D0D, #B30000)",
                boxShadow: "0 0 20px rgba(255,13,13,0.3)",
                display: "flex",
              }}
            />
          </div>

          {/* Right bond + atom */}
          <div
            style={{
              position: "absolute",
              right: "-120px",
              top: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #FF6666, #FF0D0D, #B30000)",
                boxShadow: "0 0 20px rgba(255,13,13,0.3)",
                display: "flex",
              }}
            />
          </div>

          {/* Bond lines - left */}
          <div
            style={{
              position: "absolute",
              left: "-60px",
              top: "40px",
              width: "90px",
              height: "3px",
              background: "linear-gradient(90deg, rgba(85,85,85,0.8), rgba(85,85,85,0.4))",
              transform: "rotate(25deg)",
              display: "flex",
            }}
          />

          {/* Bond lines - right */}
          <div
            style={{
              position: "absolute",
              right: "-60px",
              top: "40px",
              width: "90px",
              height: "3px",
              background: "linear-gradient(270deg, rgba(85,85,85,0.8), rgba(85,85,85,0.4))",
              transform: "rotate(-25deg)",
              display: "flex",
            }}
          />

          {/* Displacement arrows - left */}
          <div
            style={{
              position: "absolute",
              left: "-170px",
              top: "100px",
              width: "40px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #00D8FF)",
              transform: "rotate(45deg)",
              opacity: 0.6,
              display: "flex",
            }}
          />

          {/* Displacement arrows - right */}
          <div
            style={{
              position: "absolute",
              right: "-170px",
              top: "100px",
              width: "40px",
              height: "2px",
              background: "linear-gradient(270deg, transparent, #00D8FF)",
              transform: "rotate(-45deg)",
              opacity: 0.6,
              display: "flex",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-1px",
              textShadow: "0 0 40px rgba(0,216,255,0.2)",
            }}
          >
            Normal Mode Explorer
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              maxWidth: "700px",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Interactive 3D molecular vibration visualization with
            displacement arrows, Boltzmann populations, and mode superposition
          </p>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          {["IR/Raman Spectra", "3D Animations", "30+ Molecules", "Symmetry Analysis"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "8px 20px",
                  borderRadius: "20px",
                  border: "1px solid rgba(0,216,255,0.2)",
                  background: "rgba(0,216,255,0.05)",
                  color: "rgba(0,216,255,0.8)",
                  fontSize: "15px",
                  fontWeight: 500,
                  display: "flex",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* URL badge */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "16px",
          }}
        >
          nme.tubhyam.dev
        </div>
      </div>
    ),
    { ...size }
  );
}
