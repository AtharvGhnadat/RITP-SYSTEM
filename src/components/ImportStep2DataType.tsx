
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen } from 'lucide-react';

interface DataTypeConfig {
  icon: React.ComponentType<any>;
  label: string;
  fields: { [key: string]: string };
  requiredFields: string[];
}

interface ImportStep2DataTypeProps {
  dataTypeConfigs: { [key: string]: DataTypeConfig };
  onDataTypeSelect: (type: 'students' | 'faculty' | 'subjects') => void;
  dataType: string;
}

const ImportStep2DataType: React.FC<ImportStep2DataTypeProps> = ({
  dataTypeConfigs,
  onDataTypeSelect,
  dataType
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Select Data Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(dataTypeConfigs).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <Card 
                key={type}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  dataType === type ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onDataTypeSelect(type as any)}
              >
                <CardContent className="p-6 text-center">
                  <Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">{config.label}</h3>
                  <p className="text-sm text-gray-600">
                    Import {config.label.toLowerCase()} data from your CSV
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportStep2DataType;
