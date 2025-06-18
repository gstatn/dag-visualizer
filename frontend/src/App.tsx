import React, { useState, useRef, useCallback } from "react";
import "./App.css";

type SplitterType = "horizontal" | "vertical" | "top-vertical";

const ResizablePanes = () => {
  const [horizontalSplit, setHorizontalSplit] = useState(20);
  const [verticalSplit, setVerticalSplit] = useState(15);
  const [topVerticalSplit, setTopVerticalSplit] = useState(15);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<SplitterType | null>(null);

  const handleMouseDown = (splitter: SplitterType) => (e: React.MouseEvent) => {
    isDragging.current = splitter;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    if (isDragging.current === "horizontal") {
      const newSplit = ((e.clientY - rect.top) / rect.height) * 100;
      setHorizontalSplit(Math.max(10, Math.min(90, newSplit)));
    } else if (isDragging.current === "vertical") {
      const newSplit = ((e.clientX - rect.left) / rect.width) * 100;
      setVerticalSplit(Math.max(10, Math.min(90, newSplit)));
    } else if (isDragging.current === "top-vertical") {
      const newSplit = ((e.clientX - rect.left) / rect.width) * 100;
      setTopVerticalSplit(Math.max(10, Math.min(90, newSplit)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "calc(100% - 1px)",
          height: "calc(100% - 1px)",
          margin: "0px",
          backgroundColor: "white",
          border: "1px solid #3d3c3c",
          display: "grid",
          gridTemplateColumns: `${verticalSplit}% 2px 2fr`,
          gridTemplateRows: `${horizontalSplit}% 2px 2fr`,
          gap: "0",
        }}
      >
        {/* Top Section */}
        <div
          style={{
            gridColumn: "1 / 4",
            gridRow: "1",
            backgroundColor: "white",
            border: "1px solid #3d3c3c",
            display: "grid",
            gridTemplateColumns: `${topVerticalSplit}% 2px 2fr`,
            gap: "0",
          }}
        >
          {/* Top-left pane */}
          <div
            style={{
              backgroundColor: "#1f1e1e",
              border: "1px solid #3d3c3c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: "500" }}>
              Top Left
            </span>
          </div>

          {/* Top vertical splitter */}
          <div
            style={{
              backgroundColor: "#d1d5db",
              cursor: "col-resize",
            }}
            onMouseDown={handleMouseDown("top-vertical")}
          />

          {/* Top-right pane */}
          <div
            style={{
              backgroundColor: "#1f1e1e",
              border: "1px solid #3d3c3c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: "500" }}>
              Top Right
            </span>
          </div>
        </div>

        {/* Horizontal splitter */}
        <div
          style={{
            gridColumn: "1 / 4",
            gridRow: "2",
            backgroundColor: "#d1d5db",
            cursor: "row-resize",
          }}
          onMouseDown={handleMouseDown("horizontal")}
        />

        {/* Bottom-left pane */}
        <div
          style={{
            gridColumn: "1",
            gridRow: "3",
            backgroundColor: "#1f1e1e",
            border: "1px solid #3d3c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#ffffff", fontWeight: "500" }}>
            Bottom Left
          </span>
        </div>

        {/* Vertical splitter */}
        <div
          style={{
            gridColumn: "2",
            gridRow: "3",
            backgroundColor: "#d1d5db",
            cursor: "col-resize",
          }}
          onMouseDown={handleMouseDown("vertical")}
        />

        {/* Bottom-right pane (main content area) */}
        <div
          style={{
            gridColumn: "3",
            gridRow: "3",
            backgroundColor: "#292828",
            border: "1px solid #3d3c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#ffffff", fontWeight: "500" }}>
            Main Content Area
          </span>
        </div>
      </div>
    </div>
  );
};

function App() {
  return <ResizablePanes />;
}

export default App;
