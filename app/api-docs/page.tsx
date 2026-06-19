"use client";
import { useEffect } from "react";

export default function ApiDocsPage() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      // @ts-expect-error global injected by the script
      window.SwaggerUIBundle?.({ url: "/api/v1/openapi.json", dom_id: "#swagger-ui" });
    };
    document.body.appendChild(script);
    return () => { link.remove(); script.remove(); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <div id="swagger-ui" />
      <noscript>Enable JavaScript to view the API documentation.</noscript>
    </div>
  );
}
