import API from "./api";

export const uploadAttachment = async (
  file,
  onUploadProgress
) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await API.post(
    "/uploads",
    formData,
    {
      onUploadProgress: (progressEvent) => {
        if (
          typeof onUploadProgress !== "function" ||
          !progressEvent.total
        ) {
          return;
        }

        const percentage = Math.round(
          (progressEvent.loaded * 100) /
            progressEvent.total
        );

        onUploadProgress(percentage);
      },
    }
  );

  return response.data.attachment;
};

export const fetchAttachmentBlob = async (
  storedName
) => {
  const response = await API.get(
    `/uploads/${encodeURIComponent(storedName)}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};