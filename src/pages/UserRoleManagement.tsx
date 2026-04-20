import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { extractErrorMessage } from '../utils/errorHandler';
// import { useLanguage } from '../contexts/LanguageContext';

interface UserWithRole {
  user_id: number;
  email: string;
  full_name: string;
  basic_role: string;
  role_id: number | null;
  role_display_name: string | null;
  approval_limit: number | null;
  can_delegate: boolean | null;
  assigned_at: Date | null;
  assigned_by_name: string | null;
}

interface AvailableRole {
  role_name: string;
  default_approval_limit: number;
  description: string;
}

interface SearchUser {
  user_id: number;
  email: string;
  full_name: string;
}

const UserRoleManagement = () => {
  // const { t } = useLanguage(); // Unused for now
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditLimitModal, setShowEditLimitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Form state for assigning role
  const [assignForm, setAssignForm] = useState({
    userEmail: '',
    roleName: '',
    customApprovalLimit: '',
    canDelegate: false,
  });
  
  // Form state for editing approval limit
  const [editLimitForm, setEditLimitForm] = useState({
    targetUserId: 0,
    roleId: 0,
    currentLimit: 0,
    newLimit: '',
    reason: '',
    userName: '',
  });

  // Load users and roles
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/user-roles/users-with-roles'),
        api.get('/user-roles/roles'),
      ]);
      
      setUsers(usersRes.data.data);
      setAvailableRoles(rolesRes.data.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const handleSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const response = await api.get(`/user-roles/search-users?q=${encodeURIComponent(term)}`);
      setSearchResults(response.data.data);
    } catch (error: any) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  // Select user from search results
  const selectUser = (user: SearchUser) => {
    setAssignForm({ ...assignForm, userEmail: user.email });
    setSearchTerm('');
    setSearchResults([]);
  };

  // Assign role
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await api.post('/user-roles/assign-role', {
        userEmail: assignForm.userEmail,
        roleName: assignForm.roleName,
        customApprovalLimit: assignForm.customApprovalLimit ? parseFloat(assignForm.customApprovalLimit) : undefined,
        canDelegate: assignForm.canDelegate,
      });
      
      toast.success('Role assigned successfully');
      closeAssignModal();
      loadData();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update approval limit
  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await api.put('/user-roles/update-approval-limit', {
        targetUserId: editLimitForm.targetUserId,
        roleId: editLimitForm.roleId,
        newLimit: parseFloat(editLimitForm.newLimit),
        reason: editLimitForm.reason,
      });
      
      toast.success('Approval limit updated successfully');
      closeEditLimitModal();
      loadData();
    } catch (error: any) {
      console.error('Error updating limit:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove role
  const handleRemoveRole = async (userId: number, roleId: number | null, userName: string) => {
    if (!roleId) {
      toast.error('User does not have a role assigned');
      return;
    }
    
    const reason = prompt(`Enter reason for removing role from ${userName}:`);
    
    if (!reason) return;
    
    try {
      await api.delete('/user-roles/remove-role', {
        data: {
          targetUserId: userId,
          roleId,
          reason,
        },
      });
      
      toast.success('Role removed successfully');
      loadData();
    } catch (error: any) {
      console.error('Error removing role:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  // Sync all admin/manager roles
  const handleSyncAllRoles = async () => {
    if (!confirm('This will sync all existing admin and manager users to the user_roles table. Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/auth/sync-admin-manager-roles');
      const result = response.data.data;
      
      toast.success(`Sync completed!\n\nSynced: ${result.synced}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`);
      loadData();
    } catch (error: any) {
      console.error('Error syncing roles:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Open assign modal
  const openAssignModal = () => {
    setAssignForm({
      userEmail: '',
      roleName: '',
      customApprovalLimit: '',
      canDelegate: false,
    });
    setShowAssignModal(true);
  };

  // Close assign modal
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssignForm({
      userEmail: '',
      roleName: '',
      customApprovalLimit: '',
      canDelegate: false,
    });
  };

  // Open edit limit modal
  const openEditLimitModal = (user: UserWithRole) => {
    if (!user.role_id) {
      toast.error('User does not have a role assigned');
      return;
    }
    
    setEditLimitForm({
      targetUserId: user.user_id,
      roleId: user.role_id,
      currentLimit: user.approval_limit || 0,
      newLimit: '',
      reason: '',
      userName: user.full_name,
    });
    setShowEditLimitModal(true);
  };

  // Close edit limit modal
  const closeEditLimitModal = () => {
    setShowEditLimitModal(false);
    setEditLimitForm({
      targetUserId: 0,
      roleId: 0,
      currentLimit: 0,
      newLimit: '',
      reason: '',
      userName: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading user roles...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">User Role Management</h1>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSyncAllRoles}
            className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-lg"
          >
            <Shield size={20} />
            Sync All Admin/Manager Roles
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAssignModal}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
          >
            <Plus size={20} />
            Assign Role
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={20} />
            <span className="font-medium">Total Users: {users.length}</span>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">EMAIL</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">FULL NAME</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">BASIC ROLE</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">APPROVAL ROLE</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">APPROVAL LIMIT</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CAN DELEGATE</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">ASSIGNED AT</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm font-medium">{user.full_name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.basic_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.basic_role === 'manager' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.basic_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.role_display_name ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {user.role_display_name}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not synced yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.approval_limit !== null ? (
                      <span className="font-semibold text-green-600">
                        ${user.approval_limit.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.can_delegate !== null ? (
                      user.can_delegate ? (
                        <span className="text-green-600">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">✗ No</span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.assigned_at ? new Date(user.assigned_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.role_display_name && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditLimitModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Approval Limit"
                          >
                            <Edit size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveRole(user.user_id, user.role_id, user.full_name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove Role"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Assign Role Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeAssignModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Assign Role to User</h2>
                <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAssignRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Email *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={assignForm.userEmail}
                      onChange={(e) => {
                        setAssignForm({ ...assignForm, userEmail: e.target.value });
                        setSearchTerm(e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Search by email or name..."
                    />
                    {searching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.user_id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-gray-600">{user.full_name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={assignForm.roleName}
                    onChange={(e) => setAssignForm({ ...assignForm, roleName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role...</option>
                    {availableRoles.map((role) => (
                      <option key={role.role_name} value={role.role_name}>
                        {role.role_name} (Default: ${role.default_approval_limit.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  {assignForm.roleName && (
                    <p className="mt-1 text-sm text-gray-600">
                      {availableRoles.find(r => r.role_name === assignForm.roleName)?.description}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Approval Limit (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={assignForm.customApprovalLimit}
                    onChange={(e) => setAssignForm({ ...assignForm, customApprovalLimit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty for default limit"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canDelegate"
                    checked={assignForm.canDelegate}
                    onChange={(e) => setAssignForm({ ...assignForm, canDelegate: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="canDelegate" className="ml-2 text-sm text-gray-700">
                    Can delegate approval authority
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Assigning...' : 'Assign Role'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Approval Limit Modal */}
      <AnimatePresence>
        {showEditLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeEditLimitModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Update Approval Limit</h2>
                <button onClick={closeEditLimitModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateLimit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-semibold">{editLimitForm.userName}</p>
                  <p className="text-sm text-gray-600 mt-2">Current Limit</p>
                  <p className="font-semibold text-green-600">
                    ${editLimitForm.currentLimit.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Approval Limit *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editLimitForm.newLimit}
                    onChange={(e) => setEditLimitForm({ ...editLimitForm, newLimit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new limit"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change *</label>
                  <textarea
                    required
                    value={editLimitForm.reason}
                    onChange={(e) => setEditLimitForm({ ...editLimitForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Explain why this limit is being changed..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditLimitModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Limit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserRoleManagement;
