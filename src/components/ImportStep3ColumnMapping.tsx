
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CSVRow } from '@/utils/csvParser';

interface DataTypeConfig {
  fields: { [key: string]: string };
  requiredFields: string[];
}

interface ImportStep3ColumnMappingProps {
  dataType: string;
  dataTypeConfig: DataTypeConfig;
  csvData: CSVRow[];
  columnMapping: { [csvColumn: string]: string };
  onColumnMappingChange: (mapping: { [csvColumn: string]: string }) => void;
  onValidation: () => void;
  onBack: () => void;
}

const ImportStep3ColumnMapping: React.FC<ImportStep3ColumnMappingProps> = ({
  dataType,
  dataTypeConfig,
  csvData,
  columnMapping,
  onColumnMappingChange,
  onValidation,
  onBack
}) => {
  const handleMappingChange = (field: string, csvCol: string) => {
    const newMapping = { ...columnMapping };
    
    // Remove existing mapping for this field
    Object.keys(newMapping).forEach(col => {
      if (newMapping[col] === field) delete newMapping[col];
    });
    
    // Add new mapping only if not skipping
    if (csvCol && csvCol !== 'skip') {
      newMapping[csvCol] = field;
    }
    
    onColumnMappingChange(newMapping);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Map CSV Columns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {csvData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dataTypeConfig.fields).map(([field, label]) => (
                <div key={field}>
                  <label className="text-sm font-medium">
                    {label} {dataTypeConfig.requiredFields.includes(field) && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <Select 
                    value={Object.keys(columnMapping).find(col => columnMapping[col] === field) || 'skip'} 
                    onValueChange={(csvCol) => handleMappingChange(field, csvCol)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CSV column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">-- Skip this field --</SelectItem>
                      {Object.keys(csvData[0]).map((column) => (
                        <SelectItem key={column} value={column}>{column}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={onValidation}>
              Continue to Validation
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportStep3ColumnMapping;
