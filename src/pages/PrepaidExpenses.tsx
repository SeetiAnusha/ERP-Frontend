import { motion } from 'framer-motion';

const PrepaidExpenses = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      <h2 className="text-2xl font-bold mb-4">Prepaid Expenses Module</h2>
      <p className="text-gray-600">Prepaid expenses management coming soon...</p>
      <p className="text-sm text-gray-500 mt-4">
        This module will track prepaid expenses, bonds, deposits, and policies.
      </p>
    </motion.div>
  );
};

export default PrepaidExpenses;
