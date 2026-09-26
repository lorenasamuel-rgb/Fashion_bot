import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8C040",
          color: "#1D1D1F",
          fontSize: 104,
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
