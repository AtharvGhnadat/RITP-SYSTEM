
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload } from 'lucide-react';

interface ImportStep1UploadProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  csvFile: File | null;
  csvDataLength: number;
}

const ImportStep1Upload: React.FC<ImportStep1UploadProps> = ({
  onFileUpload,
  csvFile,
  csvDataLength
}) => {
  const handleButtonClick = () => {
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Step 1: Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your CSV file</h3>
          <p className="text-gray-600 mb-4">
            Choose a CSV file containing your data. Make sure the first row contains column headers.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={onFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button onClick={handleButtonClick} type="button">
            Choose CSV File
          </Button>
          {csvFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {csvFile.name} ({csvDataLength} rows)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportStep1Upload;
