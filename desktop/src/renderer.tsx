import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LearningApp } from "../../app/components/LearningApp";
import "../../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("桌面页面缺少 root 容器");

createRoot(root).render(
  <StrictMode>
    <LearningApp />
  </StrictMode>,
);
