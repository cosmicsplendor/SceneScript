import React from "react";

/**
 * John Scott's Eyeline & Caption Template
 * Overlay for 9:16 Vertical Video (Shorts/Reels/TikTok)
 */
export const EyelineTemplate = ({ active = true }) => {
  // If active is false, render nothing (cleaner than commenting out)
  if (!active) return null;

  // Common styles for the overlay container
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none", // Ensures you can still click/interact with video below in preview
    zIndex: 9999, // Forces it to sit on top of everything
    fontFamily: "Impact, sans-serif", // Matches the meme/video style font
    fontWeight: "bold",
    textTransform: "uppercase",
  };

  // Helper to create the box styles
  const getBoxStyle = (
    top: string,
    height: string,
    width: string,
    color: string
  ): React.CSSProperties => ({
    position: "absolute",
    top: top,
    height: height,
    width: width,
    left: "50%", // Center horizontally
    transform: "translateX(-50%)", // Center horizontally
    border: `8px solid ${color}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    // Text styling
    color: color,
    fontSize: "clamp(20px, 4vw, 50px)", // Responsive font size
    textShadow: "2px 2px 0px rgba(0,0,0,0.8)", // Black outline for readability
  });

  return (
    <div style={containerStyle}>
      {/* 
        EYE-LINE RECTANGLE (White)
        Extraction: Starts ~18% down, approx 25% height.
        Width is nearly full (95%) to allow lateral movement.
      */}
      <div style={getBoxStyle("18%", "25%", "95%", "white")}>
        {/* Eye-Line */}
      </div>

      {/* 
        CAPTIONS RECTANGLE (Yellow)
        Extraction: Starts ~59% down, approx 16% height.
        Width is narrower (75%) to avoid TikTok/Shorts side buttons.
      */}
      <div style={getBoxStyle("59%", "16%", "75%", "#FFD700")}>
        {/* Captions */}
      </div>
    </div>
  );
};