import { useEffect, useState } from "react";
import { hashFile } from "../lib/hash.js";

// Lets the user choose an image, shows a preview, and hands the file and its
// SHA-256 hash to the page. The file never leaves the browser.
export default function FilePicker({ prompt, onFileHashed }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleChange(event) {
    const chosenFile = event.target.files[0];
    if (!chosenFile) {
      return;
    }
    setFile(chosenFile);
    setPreviewUrl(URL.createObjectURL(chosenFile));
    onFileHashed(chosenFile, await hashFile(chosenFile));
  }

  return (
    <div className="file-picker">
      <label className="drop-zone">
        <input type="file" accept="image/*" onChange={handleChange} />
        <span className="drop-zone-title">{file ? file.name : prompt}</span>
        <span className="drop-zone-hint">{file ? "Click to choose a different file" : "PNG, JPG, SVG or WebP"}</span>
      </label>
      {previewUrl && <img className="preview" src={previewUrl} alt={`Preview of ${file.name}`} />}
    </div>
  );
}
