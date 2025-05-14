import { FiUpload, FiX, FiCheck } from "react-icons/fi";
import type { UploadedFile } from "../types";

type DocumentUploadProps = {
  uploadedFiles: UploadedFile[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;
};

export const DocumentUpload = ({
  uploadedFiles,
  handleFileUpload,
  removeFile,
}: DocumentUploadProps) => {
  // // Debugging -
  // console.log("Rendering DocumentUpload with files:", uploadedFiles);

  return (
    <>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <FiUpload className="h-12 w-12 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-2">Drag and drop files here or</p>
        <label className="cursor-pointer inline-block">
          <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Browse Files
          </span>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG up to 10MB</p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <ul className="space-y-2">
            {uploadedFiles.map((file) => {
              // console.log("Rendering file:", file)
              return (
                <li
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center min-w-0">
                    <FiCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span
                      className="text-sm text-gray-900 truncate"
                      title={file.name}
                    >
                      {file.name || "Untitled File"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};
