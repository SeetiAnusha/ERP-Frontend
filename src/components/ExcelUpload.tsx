import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'sonner';

interface ExcelUploadProps {
  type: 'products' | 'suppliers' | 'clients';
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  message: string;
}

const ExcelUpload = ({ type, onSuccess }: ExcelUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeLabels = {
    products: 'Products',
    suppliers: 'Suppliers',
    clients: 'Clients'
  };

  const typeColumns = {
    products: 'code, name, description, unit, quantity, unitCost, salesPrice, taxRate',
    suppliers: 'code, name, rnc, phone, address, email, supplierType, paymentTerms',
    clients: 'code, name, rncCedula, phone, address, email, clientType, creditLimit, paymentTerms'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an Excel file (.xls or .xlsx)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setShowResults(false);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/import/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const importResult: ImportResult = response.data;
      setResult(importResult);
      setShowResults(true);

      if (importResult.success) {
        toast.success(importResult.message);
        if (onSuccess) {
          onSuccess(); // Refresh the parent table
        }
      } else {
        toast.error(importResult.message);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
      toast.error(errorMessage);
      
      setResult({
        success: false,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [{ row: 0, error: errorMessage }],
        message: errorMessage
      });
      setShowResults(true);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const closeResults = () => {
    setShowResults(false);
    setResult(null);
  };

  return (
    <>
      {/* Upload Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleButtonClick}
        disabled={isUploading}
        className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload size={20} />
            <span>Import Excel</span>
          </>
        )}
      </motion.button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeResults}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="text-green-600" size={32} />
                  ) : (
                    <AlertCircle className="text-red-600" size={32} />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {typeLabels[type]} Import Results
                    </h2>
                    <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                  </div>
                </div>
                <button onClick={closeResults} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{result.inserted}</div>
                  <div className="text-sm text-gray-600">Inserted</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.updated}</div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">{result.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
              </div>

              {/* Errors Section */}
              {result.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="text-red-600" size={20} />
                    Errors ({result.errors.length})
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="mb-3 last:mb-0">
                        <div className="font-medium text-red-800">
                          Row {error.row}: {error.error}
                        </div>
                        {error.data && (
                          <div className="text-xs text-gray-600 mt-1 font-mono bg-white p-2 rounded">
                            {JSON.stringify(error.data, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected Format Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="text-blue-600" size={18} />
                  Expected Excel Format
                </h3>
                <p className="text-xs text-gray-700 mb-2">
                  Your Excel file should have these columns (first row as header):
                </p>
                <code className="text-xs bg-white px-2 py-1 rounded block overflow-x-auto">
                  {typeColumns[type]}
                </code>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Duplicate Detection:</strong> {
                    type === 'products' ? 'By product code' :
                    type === 'suppliers' ? 'By RNC' :
                    'By RNC/Cedula'
                  }. Existing records will be updated.
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={closeResults}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExcelUpload;
