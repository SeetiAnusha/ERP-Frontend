import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  // CreditCard, // Unused import
  // Banknote, // Unused import
  Plus
  // Trash2, // Unused import
  // Calculator // Unused import
} from 'lucide-react';

// This is a placeholder component - the actual functionality should be moved to the appropriate component
interface EnhancedPurchaseFormProps {
  defaultTransactionType?: string;
  onSubmit?: (data: any) => void;
}

const EnhancedPurchaseForm: React.FC<EnhancedPurchaseFormProps> = ({
  defaultTransactionType = 'GOODS',
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    total: 0,
    paymentType: 'CASH'
  });

  // Remove unused variables
  // const [selectedSupplier, setSelectedSupplier] = useState(null);
  // const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold mb-6">Enhanced Purchase Form</h2>
      <p className="text-gray-600 mb-4">
        This component has been deprecated. Please use the main Purchases page for creating purchases.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type
          </label>
          <input 
            type="text" 
            value={defaultTransactionType} 
            readOnly 
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Amount
          </label>
          <input 
            type="number" 
            value={formData.total}
            onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value) || 0})}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Purchase
        </button>
      </form>
    </motion.div>
  );
};

export default EnhancedPurchaseForm;