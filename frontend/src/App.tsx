import { useState } from "react";
import { Library } from "./panels/Library";
import { Editor } from "./canvas/Editor";

export default function App() {
  const [mapId, setMapId] = useState<string | null>(null);
  if (mapId) return <Editor mapId={mapId} onVoltar={() => setMapId(null)} />;
  return <Library onAbrir={setMapId} />;
}
