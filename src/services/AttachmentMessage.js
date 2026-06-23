import React, { useEffect, useState } from "react";
import { FaDownload, FaFileAlt, FaImage } from "react-icons/fa";

import { fetchAttachmentBlob } from "../services/attachmentService";

const formatFileSize = (size) => {
  if (!Number.isFinite(size) || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function AttachmentMessage({ message }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isImage =
    message.messageType === "image" ||
    message.attachmentMimeType?.startsWith("image/");

  useEffect(() => {
    let active = true;
    let createdObjectUrl = null;

    const loadImage = async () => {
      if (!isImage || !message.attachmentStoredName) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const blob = await fetchAttachmentBlob(
          message.attachmentStoredName
        );

        if (!active) {
          return;
        }

        createdObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(createdObjectUrl);
      } catch (loadError) {
        if (active) {
          setError("Unable to load image");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      active = false;

      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [isImage, message.attachmentStoredName]);

  const downloadAttachment = async () => {
    if (!message.attachmentStoredName) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const blob = await fetchAttachmentBlob(
        message.attachmentStoredName
      );

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download =
        message.attachmentOriginalName || "attachment";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      setError("Unable to download file");
    } finally {
      setIsLoading(false);
    }
  };

  if (isImage) {
    return (
      <div className="mb-2">
        {isLoading && !objectUrl && (
          <div className="flex h-40 w-64 items-center justify-center rounded-lg bg-black/20 text-sm text-slate-200">
            Loading image...
          </div>
        )}

        {error && !objectUrl && (
          <div className="flex h-28 w-64 flex-col items-center justify-center gap-2 rounded-lg bg-black/20 text-sm text-red-200">
            <FaImage size={24} />
            {error}
          </div>
        )}

        {objectUrl && (
          <button
            type="button"
            onClick={downloadAttachment}
            className="block overflow-hidden rounded-lg"
            title="Download image"
          >
            <img
              src={objectUrl}
              alt={
                message.attachmentOriginalName || "Shared image"
              }
              className="max-h-72 w-full max-w-sm object-cover"
            />
          </button>
        )}

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-100">
          <span className="max-w-52 truncate">
            {message.attachmentOriginalName || "Image"}
          </span>

          <button
            type="button"
            onClick={downloadAttachment}
            disabled={isLoading}
            className="rounded-full p-2 transition hover:bg-black/20 disabled:opacity-50"
            title="Download image"
          >
            <FaDownload />
          </button>
        </div>

        {error && objectUrl && (
          <p className="mt-1 text-xs text-red-200">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={downloadAttachment}
      disabled={isLoading}
      className="mb-2 flex w-full min-w-56 items-center gap-3 rounded-lg bg-black/20 p-3 text-left transition hover:bg-black/30 disabled:opacity-60"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900/40">
        <FaFileAlt size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {message.attachmentOriginalName || "Attachment"}
        </p>

        <p className="mt-1 text-xs text-slate-200">
          {isLoading
            ? "Downloading..."
            : formatFileSize(message.attachmentSize)}
        </p>

        {error && (
          <p className="mt-1 text-xs text-red-200">{error}</p>
        )}
      </div>

      <FaDownload className="shrink-0" />
    </button>
  );
}

export default AttachmentMessage;