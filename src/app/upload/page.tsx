import FileUploadForm from "@/components/app/FileUploadForm";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-8">
      <FileUploadForm />
    </div>
  );
}
