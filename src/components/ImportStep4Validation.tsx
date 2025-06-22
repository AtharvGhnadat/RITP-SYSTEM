
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';
import type { ValidationError } from '@/utils/dataValidator';

interface ImportSummary {
  total: number;
  success: number;
  updated: number;
  errors: number;
}

interface ImportStep4ValidationProps {
  validationErrors: ValidationError[];
  csvDataLength: number;
  isProcessing: boolean;
  importProgress: number;
  importSummary: ImportSummary | null;
  onImport: () => void;
  onBack: () => void;
  onReset: () => void;
}

const ImportStep4Validation: React.FC<ImportStep4ValidationProps> = ({
  validationErrors,
  csvDataLength,
  isProcessing,
  importProgress,
  importSummary,
  onImport,
  onBack,
  onReset
}) => {
  return (
    <div className="space-y-6">
      {/* Validation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationErrors.length === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Validation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validationErrors.length === 0 ? (
            <div className="text-green-600">
              ✅ All data validated successfully! Ready to import {csvDataLength} records.
            </div>
          ) : (
            <div>
              <div className="text-yellow-600 mb-4">
                ⚠️ Found {validationErrors.length} validation errors. You can still proceed with import, but errored rows will be skipped.
              </div>
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationErrors.slice(0, 50).map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.field}</TableCell>
                        <TableCell className="text-red-600">{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {validationErrors.length > 50 && (
                  <p className="text-sm text-gray-500 mt-2">
                    And {validationErrors.length - 50} more errors...
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
        </CardHeader>
        <CardContent>
          {!importSummary ? (
            <div className="space-y-4">
              {isProcessing && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Importing data...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={onImport} 
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isProcessing ? 'Importing...' : 'Start Import'}
                </Button>
                <Button variant="outline" onClick={onBack} disabled={isProcessing}>
                  Back
                </Button>
                <Button variant="outline" onClick={onReset} disabled={isProcessing}>
                  Start Over
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Import Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importSummary.total}</div>
                  <div className="text-sm text-blue-600">Total Rows</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importSummary.success}</div>
                  <div className="text-sm text-green-600">New Records</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importSummary.updated}</div>
                  <div className="text-sm text-yellow-600">Updated</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importSummary.errors}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              </div>
              <Button onClick={onReset}>
                Import Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportStep4Validation;
