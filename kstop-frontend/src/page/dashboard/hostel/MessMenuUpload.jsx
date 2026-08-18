import { useState } from "react";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

export default function MessMenuUpload() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadedMenu, setUploadedMenu] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    setError("");
    setMessage("");
    setUploadedMenu(null);

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      setFile(null);
      setPreviewUrl("");
      setError("Please select a .jpeg, .jpg, or .png menu image.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Choose a menu image before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("menuImage", file);

    try {
      setIsUploading(true);
      // IMPORTANT: our shared api instance sends "Content-Type: application/json"
      // by default, which corrupts file uploads. Setting it to undefined makes
      // axios detect the FormData and build the correct multipart header
      // (including the boundary text) automatically.
      const response = await api.post("/hostel/mess-menu", formData, {
        headers: { "Content-Type": undefined },
      });
      setUploadedMenu(response.data.menu);
      setMessage("Menu uploaded successfully. It is now visible to mentors, hostel users, and all students.");
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "Menu upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  const imageUrl = uploadedMenu?.imageUrl || previewUrl;

  return (
    <HostelShell title="Upload Mess Menu" eyebrow="JPEG / PNG only">
      <section className="hostel-panel">
        <h2>Menu image</h2>
        <form onSubmit={handleUpload}>
          <div className="hostel-upload-zone">
            <input
              className="hostel-input"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
            />
            <p className="hostel-note">
              Students from any hostel can view this menu. Only students assigned to this hostel can rate it.
            </p>
          </div>

          <div className="hostel-actions" style={{ marginTop: 14 }}>
            <button type="submit" className="hostel-button" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Menu"}
            </button>
          </div>

          {message ? <p className="hostel-success">{message}</p> : null}
          {error ? <p className="hostel-error">{error}</p> : null}
        </form>
      </section>

      {imageUrl ? (
        <section className="hostel-panel" style={{ marginTop: 16 }}>
          <h2>{uploadedMenu ? "Uploaded menu" : "Preview"}</h2>
          <div className="hostel-menu-preview">
            <img src={imageUrl} alt="Hostel mess menu preview" />
          </div>
        </section>
      ) : null}
    </HostelShell>
  );
}
