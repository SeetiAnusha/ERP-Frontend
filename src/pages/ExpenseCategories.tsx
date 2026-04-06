import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, FolderTree, X, Check, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useExpenseCategories } from '../hooks/queries/useSharedData';
import { QUERY_KEYS } from '../lib/queryKeys';
// import { useLanguage } from '../contexts/LanguageContext';

interface ExpenseCategory {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  ExpenseTypes?: ExpenseType[];
}

interface ExpenseType {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  categoryId: number;
}

const ExpenseCategories = () => {
  // const { t } = useLanguage();
  // ✅ React Query Hooks
  const { data: categories = [], isLoading, isError, refetch } = useExpenseCategories();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  // Expense Types Modal
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [newTypeData, setNewTypeData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  // ✅ Memoized: Fetch expense types
  const fetchExpenseTypes = useCallback(async (categoryId: number) => {
    try {
      const response = await api.get(`/expenses/categories/${categoryId}/types`);
      // Handle the backend response structure: { success: true, data: [...] }
      const types = response.data.success ? response.data.data : (response.data.data || response.data);
      setExpenseTypes(types || []);
    } catch (error) {
      console.error('Error fetching expense types:', error);
      setExpenseTypes([]);
    }
  }, []);

  // ✅ Memoized: Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    if (!formData.code.trim()) {
      alert('Category code is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        isActive: formData.isActive
      };

      if (editingCategory) {
        await api.put(`/expenses/categories/${editingCategory.id}`, submitData);
      } else {
        await api.post('/expenses/categories', submitData);
      }
      
      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenseCategories });
      refetch();
      closeModal();
    } catch (error: any) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error saving category';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, editingCategory, formData, queryClient, refetch]);

  // ✅ Memoized: Handle add expense type
  const handleAddExpenseType = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTypeData.name.trim() || !selectedCategory) {
      alert('Type name is required');
      return;
    }

    if (!newTypeData.code.trim()) {
      alert('Type code is required');
      return;
    }

    try {
      const submitData = {
        categoryId: selectedCategory.id,
        name: newTypeData.name.trim(),
        code: newTypeData.code.trim().toUpperCase(),
        description: newTypeData.description.trim() || null,
        isActive: newTypeData.isActive
      };

      await api.post('/expenses/types', submitData);
      
      fetchExpenseTypes(selectedCategory.id);
      setNewTypeData({ name: '', code: '', description: '', isActive: true });
      setShowAddTypeForm(false);
    } catch (error: any) {
      console.error('Error adding expense type:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error adding expense type';
      alert(errorMessage);
    }
  }, [newTypeData, selectedCategory, fetchExpenseTypes]);

  // ✅ Memoized: Handle delete category
  const handleDeleteCategory = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/expenses/categories/${id}`);
      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenseCategories });
      refetch();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.error || 'Error deleting category');
    }
  }, [queryClient, refetch]);

  // ✅ Memoized: Handle toggle status
  const handleToggleStatus = useCallback(async (category: ExpenseCategory) => {
    try {
      await api.put(`/expenses/categories/${category.id}`, {
        ...category,
        isActive: !category.isActive
      });
      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenseCategories });
      refetch();
    } catch (error: any) {
      console.error('Error updating category status:', error);
      alert(error.response?.data?.error || 'Error updating category status');
    }
  }, [queryClient, refetch]);

  // ✅ Memoized: Open modal
  const openModal = useCallback((category?: ExpenseCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        code: category.code || '',
        description: category.description,
        isActive: category.isActive
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true
      });
    }
    setShowModal(true);
  }, []);

  // ✅ Memoized: Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '', isActive: true });
  }, []);

  // ✅ Memoized: Open types modal
  const openTypesModal = useCallback((category: ExpenseCategory) => {
    setSelectedCategory(category);
    setShowTypesModal(true);
    fetchExpenseTypes(category.id);
  }, [fetchExpenseTypes]);

  // ✅ Memoized: Close types modal
  const closeTypesModal = useCallback(() => {
    setShowTypesModal(false);
    setSelectedCategory(null);
    setExpenseTypes([]);
    setShowAddTypeForm(false);
    setNewTypeData({ name: '', code: '', description: '', isActive: true });
  }, []);

  // ✅ Memoized: Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // ✅ Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error loading expense categories</p>
          <button
            onClick={() => refetch()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FolderTree className="text-blue-600" />
          Expense Categories
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Add Category Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg whitespace-nowrap"
          >
            <Plus size={20} />
            Add Category
          </motion.button>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 mt-4">No expense categories found</p>
          <button
            onClick={() => openModal()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Your First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                category.isActive ? 'border-green-500' : 'border-gray-400'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {category.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-600">
                      {category.code}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {category.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    category.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => openTypesModal(category)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Types ({category.ExpenseTypes?.length || 0})
                </button>
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleStatus(category)}
                    className={`p-2 rounded-lg ${
                      category.isActive 
                        ? 'text-orange-600 hover:bg-orange-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={category.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {category.isActive ? <AlertCircle size={18} /> : <Check size={18} />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openModal(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., General & Administrative"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., GEN_ADMIN"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use uppercase letters, numbers, and underscores only (max 10 characters)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of this category..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Types Modal */}
      <AnimatePresence>
        {showTypesModal && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeTypesModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  Expense Types - {selectedCategory.name}
                </h2>
                <button onClick={closeTypesModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Add Type Form */}
              {showAddTypeForm && (
                <form onSubmit={handleAddExpenseType} className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTypeData.name}
                        onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Electricity"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTypeData.code}
                        onChange={(e) => setNewTypeData({ ...newTypeData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., ELEC"
                        maxLength={15}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newTypeData.description}
                        onChange={(e) => setNewTypeData({ ...newTypeData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddTypeForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Type
                    </button>
                  </div>
                </form>
              )}

              {/* Add Type Button */}
              {!showAddTypeForm && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowAddTypeForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add Expense Type
                  </button>
                </div>
              )}

              {/* Types List */}
              {expenseTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No expense types found for this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenseTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 border rounded-lg ${
                        type.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-800">{type.name}</h4>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-blue-100 text-blue-600">
                              {type.code}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {type.description || 'No description'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          type.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {type.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseCategories;