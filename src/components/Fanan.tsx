// Fanan — the fennec-fox mascot. Faithful React port of Fanan.dc.html.
// Pure divs + inline styles; every colour, size and offset is lifted literally
// from the source. Pose → booleans exactly mirror the .dc.html renderVals().
//
// Fanan NEVER mirrors in RTL — the geometry uses physical left/right on purpose,
// so he renders identically inside dir="rtl" containers (HANDOFF §2 · never mirrors).
//
// Requires the global @keyframes `float` and `sparkle-pop` (src/styles.css).
import type { CSSProperties } from "react";

export type FananPose = "idle" | "think" | "cheer" | "sad" | "celebrate" | "wave";

export interface FananProps {
  pose?: FananPose;
  /** Uniform scale about the bottom-centre anchor. Default 1. */
  scale?: number;
  className?: string;
}

export function Fanan({ pose = "idle", scale = 1, className = "" }: FananProps) {
  // renderVals() from Fanan.dc.html — mapped 1:1.
  const happy = pose === "cheer" || pose === "celebrate";
  const dots = !happy;
  const isSad = pose === "sad";
  const isThink = pose === "think";
  const isCeleb = pose === "celebrate";
  const mouthSmile = pose === "idle" || pose === "wave";
  const mouthOpen = happy;
  const mouthFrown = pose === "sad";
  const mouthLine = pose === "think";
  const raisePaw = pose === "wave" || pose === "celebrate";

  const wrapStyle: CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: "center bottom",
    width: "120px",
    height: "118px",
  };

  return (
    <div className={className} style={wrapStyle}>
      <div style={{ position: "relative", width: "120px", height: "118px" }}>
        {/* ears */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "12px",
            width: "36px",
            height: "54px",
            borderRadius: "66% 34% 48% 52%/76% 76% 26% 26%",
            background: "#E6B24C",
            transform: "rotate(-20deg)",
            boxShadow: "inset 0 -4px 0 rgba(0,0,0,.06)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "11px",
              left: "11px",
              width: "14px",
              height: "30px",
              borderRadius: "50%",
              background: "#F08A75",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            right: "12px",
            width: "36px",
            height: "54px",
            borderRadius: "34% 66% 52% 48%/76% 76% 26% 26%",
            background: "#E6B24C",
            transform: "rotate(20deg)",
            boxShadow: "inset 0 -4px 0 rgba(0,0,0,.06)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "11px",
              right: "11px",
              width: "14px",
              height: "30px",
              borderRadius: "50%",
              background: "#F08A75",
            }}
          />
        </div>

        {/* head */}
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "19px",
            width: "82px",
            height: "78px",
            borderRadius: "50% 50% 47% 47%",
            background: "#E6B24C",
            boxShadow: "inset 0 -7px 0 rgba(0,0,0,.07)",
          }}
        />

        {/* muzzle */}
        <div
          style={{
            position: "absolute",
            top: "74px",
            left: "37px",
            width: "46px",
            height: "32px",
            borderRadius: "50%",
            background: "#FBF7EF",
          }}
        />

        {/* sparkles (celebrate) */}
        {isCeleb && (
          <>
            <div
              style={{
                position: "absolute",
                top: "2px",
                left: "2px",
                width: "9px",
                height: "9px",
                background: "#F0C879",
                borderRadius: "2px",
                transform: "rotate(45deg)",
                animation: "sparkle-pop .5s ease both",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: 0,
                width: "11px",
                height: "11px",
                background: "#E8654C",
                borderRadius: "2px",
                transform: "rotate(45deg)",
                animation: "sparkle-pop .5s ease .1s both",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "30px",
                right: "-6px",
                width: "7px",
                height: "7px",
                background: "#0F6E6A",
                borderRadius: "2px",
                transform: "rotate(45deg)",
                animation: "sparkle-pop .5s ease .2s both",
              }}
            />
          </>
        )}

        {/* eyes: happy arcs */}
        {happy && (
          <>
            <div
              style={{
                position: "absolute",
                top: "56px",
                left: "36px",
                width: "15px",
                height: "9px",
                border: "3px solid #16302E",
                borderBottom: "none",
                borderRadius: "15px 15px 0 0",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "56px",
                left: "69px",
                width: "15px",
                height: "9px",
                border: "3px solid #16302E",
                borderBottom: "none",
                borderRadius: "15px 15px 0 0",
              }}
            />
          </>
        )}

        {/* eyes: open dots */}
        {dots && (
          <>
            <div
              style={{
                position: "absolute",
                top: "54px",
                left: "37px",
                width: "14px",
                height: "15px",
                borderRadius: "50%",
                background: "#16302E",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  right: "3px",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#FBF7EF",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                top: "54px",
                left: "70px",
                width: "14px",
                height: "15px",
                borderRadius: "50%",
                background: "#16302E",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  right: "3px",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#FBF7EF",
                }}
              />
            </div>
          </>
        )}

        {/* sad brows */}
        {isSad && (
          <>
            <div
              style={{
                position: "absolute",
                top: "49px",
                left: "35px",
                width: "15px",
                height: "3px",
                background: "#16302E",
                borderRadius: "2px",
                transform: "rotate(14deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "49px",
                left: "70px",
                width: "15px",
                height: "3px",
                background: "#16302E",
                borderRadius: "2px",
                transform: "rotate(-14deg)",
              }}
            />
          </>
        )}

        {/* think brow + ? */}
        {isThink && (
          <>
            <div
              style={{
                position: "absolute",
                top: "49px",
                left: "70px",
                width: "14px",
                height: "3px",
                background: "#16302E",
                borderRadius: "2px",
                transform: "rotate(-16deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                right: "-4px",
                font: "800 18px/1 Rubik,sans-serif",
                color: "#0F6E6A",
              }}
            >
              ?
            </div>
          </>
        )}

        {/* nose */}
        <div
          style={{
            position: "absolute",
            top: "73px",
            left: "54px",
            width: "12px",
            height: "9px",
            borderRadius: "50%",
            background: "#16302E",
          }}
        />

        {/* mouths */}
        {mouthSmile && (
          <div
            style={{
              position: "absolute",
              top: "84px",
              left: "50px",
              width: "20px",
              height: "10px",
              border: "2.5px solid #16302E",
              borderTop: "none",
              borderRadius: "0 0 20px 20px",
            }}
          />
        )}
        {mouthOpen && (
          <div
            style={{
              position: "absolute",
              top: "83px",
              left: "51px",
              width: "18px",
              height: "12px",
              background: "#16302E",
              borderRadius: "0 0 11px 11px",
            }}
          />
        )}
        {mouthFrown && (
          <div
            style={{
              position: "absolute",
              top: "89px",
              left: "52px",
              width: "16px",
              height: "8px",
              border: "2.5px solid #16302E",
              borderBottom: "none",
              borderRadius: "16px 16px 0 0",
            }}
          />
        )}
        {mouthLine && (
          <div
            style={{
              position: "absolute",
              top: "87px",
              left: "54px",
              width: "12px",
              height: "3px",
              background: "#16302E",
              borderRadius: "2px",
            }}
          />
        )}

        {/* cheeks */}
        {happy && (
          <>
            <div
              style={{
                position: "absolute",
                top: "70px",
                left: "28px",
                width: "11px",
                height: "7px",
                borderRadius: "50%",
                background: "#F08A75",
                opacity: 0.75,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "70px",
                left: "81px",
                width: "11px",
                height: "7px",
                borderRadius: "50%",
                background: "#F08A75",
                opacity: 0.75,
              }}
            />
          </>
        )}

        {/* raised paw (wave / celebrate) */}
        {raisePaw && (
          <div
            style={{
              position: "absolute",
              top: "44px",
              right: "-4px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#E6B24C",
              boxShadow: "inset 0 -3px 0 rgba(0,0,0,.07)",
              transformOrigin: "bottom center",
              animation: "float 1s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Fanan;
