import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Trash2, AlertTriangle, CheckCircle, Clock, Play, Eye, RefreshCw } from 'lucide-react';
import axios from '../api/axios';

interface DeletionReason {
  id: number;
  reason_code: string;
  reason_name: string;
  description: string;
  requires_memo: boolean;
}

interface AvailableTransaction {
  id: number;
  registration_number: string;
  entity_name: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

interface ImpactAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedRecords: number;
  requiredApprovals: string[];
  estimatedReversalTime: number;
  directImpacts: Array<{
    type: string;
    description: string;
    amount?: number;
  }>;
  cascadeImpacts: Array<{
    type: string;
    description: string;
  }>;
  warnings: string[];
  canProceed: boolean;
  blockingIssues: string[];
}

interface ApprovalRequest {
  id: number;
  request_number: string;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  amount: number;
  reason: string;
  deletion_reason_code: string;
  custom_memo?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  risk_level: string;
  created_at: string;
  updated_at: string;
  executed_at?: string;
  steps: Array<{
    id: number;
    step_number: number;
    approver_role: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    decision_date?: string;
    notes?: string;
  }>;
}

interface PendingApproval {
  id: number;
  request_number: string;
  entity_type: string;
  entity_name: string;
  amount: number;
  requester_name: string;
  request_reason: string;
  created_at: string;
  step_number: number;
  approver_role: string;
  risk_level: string;
  step_id: number;
}

const TransactionDeletion: React.FC = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [deletionReasons, setDeletionReasons] = useState<DeletionReason[]>([]);
  const [availableTransactions, setAvailableTransactions] = useState<AvailableTransaction[]>([]);
  const [myRequests, setMyRequests] = useState<ApprovalRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Request Form State
  const [entityType, setEntityType] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<AvailableTransaction | null>(null);
  const [reason, setReason] = useState('');
  const [deletionReasonCode, setDeletionReasonCode] = useState('');
  const [customMemo, setCustomMemo] = useState('');
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);

  useEffect(() => {
    loadDeletionReasons();
    loadMyRequests();
    loadPendingApprovals();
  }, []);

  const loadDeletionReasons = async () => {
    try {
      const response = await axios.get('/transaction-deletion/reasons');
      setDeletionReasons(response.data.data || []);
    } catch (error) {
      console.error('Error loading deletion reasons:', error);
    }
  };

  const loadAvailableTransactions = async (selectedEntityType: string) => {
    if (!selectedEntityType) {
      setAvailableTransactions([]);
      return;
    }

    setLoadingTransactions(true);
    setError(null);

    try {
      const response = await axios.get(`/transaction-deletion/available-transactions/${selectedEntityType}`);
      setAvailableTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Network error while loading transactions');
      setAvailableTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadMyRequests = async () => {
    try {
      const response = await axios.get('/transaction-deletion/my-requests');
      setMyRequests(response.data.data || []);
    } catch (error) {
      console.error('Error loading my requests:', error);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const response = await axios.get('/transaction-deletion/pending-approvals');
      setPendingApprovals(response.data.data || []);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  };

  const analyzeImpact = async () => {
    if (!selectedTransaction) {
      setError('Please select a transaction first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/transaction-deletion/analyze-impact', {
        entityType,
        entityId: selectedTransaction.id
      });

      setImpactAnalysis(response.data.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to analyze impact');
    } finally {
      setLoading(false);
    }
  };

  const submitDeletionRequest = async () => {
    if (!selectedTransaction || !reason || !deletionReasonCode) {
      setError('Please fill all required fields');
      return;
    }

    const selectedReason = deletionReasons.find(r => r.reason_code === deletionReasonCode);
    if (selectedReason?.requires_memo && !customMemo.trim()) {
      setError('This deletion reason requires a custom memo');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/transaction-deletion/request-approval', {
        entityType,
        entityId: selectedTransaction.id,
        reason: reason.trim(),
        deletionReasonCode,
        customMemo: customMemo.trim() || undefined
      });

      setSuccess(`✅ Deletion request created successfully: ${response.data.data.requestNumber}`);
      // Reset form completely
      setEntityType('');
      setSelectedTransaction(null);
      setAvailableTransactions([]);
      setReason('');
      setDeletionReasonCode('');
      setCustomMemo('');
      setImpactAnalysis(null);
      // Reload requests to show new submission
      await loadMyRequests();
      // Switch to My Requests tab to show the submitted request
      setActiveTab('my-requests');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit deletion request');
    } finally {
      setLoading(false);
    }
  };

  const processApprovalStep = async (stepId: number, decision: 'APPROVED' | 'REJECTED', notes?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`/transaction-deletion/process-step/${stepId}`, {
        decision,
        notes: notes?.trim() || undefined
      });

      setSuccess(`✅ Approval step ${decision.toLowerCase()} successfully`);
      // Reload both pending approvals and requests to reflect changes
      await Promise.all([
        loadPendingApprovals(),
        loadMyRequests()
      ]);
    } catch (error: any) {
      console.error('Approval processing error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process approval step';
      setError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Execute approved deletion
  const executeApprovedDeletion = async (requestId: number, requestNumber: string) => {
    if (!window.confirm(`⚠️ Are you sure you want to EXECUTE deletion ${requestNumber}?\n\nThis action is IRREVERSIBLE and will:\n- Create reversal entries\n- Soft delete original records\n- Update all related transactions\n\nClick OK to proceed.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`/transaction-deletion/execute/${requestId}`);

      setSuccess(`🎉 Deletion ${requestNumber} executed successfully! All reversal entries have been created.`);
      // Reload requests to show updated status
      await loadMyRequests();
    } catch (error: any) {
      console.error('Execution error:', error);
      setError(`❌ ${error.response?.data?.message || 'Failed to execute deletion'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get display status
  const getDisplayStatus = (request: ApprovalRequest): string => {
    return request.executed_at ? 'EXECUTED' : request.status;
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'EXECUTED': return 'text-blue-600 bg-blue-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'CANCELLED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'EXECUTED': return <Play className="w-4 h-4" />;
      case 'REJECTED': return <AlertTriangle className="w-4 h-4" />;
      case 'CANCELLED': return <Trash2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
        <div className="flex items-center space-x-3 mb-2">
          <Trash2 className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Transaction Deletion Management</h1>
        </div>
        <p className="text-gray-600">Professional enterprise-grade transaction deletion with approval workflows</p>
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Pending Approval</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Approved (Ready to Execute)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>Executed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span>Rejected</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request" className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>Request Deletion</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Pending Approvals ({pendingApprovals.length})</span>
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>My Requests ({myRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Create Deletion Request</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    setSelectedTransaction(null);
                    setImpactAnalysis(null);
                    loadAvailableTransactions(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select transaction type</option>
                  {/* <option value="Payment">Payment</option>
                  <option value="Sale">Sale</option>
                  <option value="Purchase">Purchase</option> */}
                  <option value="AccountsPayable">Accounts Payable</option>
                  <option value="AccountsReceivable">Accounts Receivable</option> 
                  <option value="BankRegister">Bank Register</option>
                  <option value="CashRegister">Cash Register</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Transaction *
                </label>
                {loadingTransactions ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Loading available transactions...
                  </div>
                ) : availableTransactions.length > 0 ? (
                  <select
                    value={selectedTransaction?.id || ''}
                    onChange={(e) => {
                      const transaction = availableTransactions.find(t => t.id === parseInt(e.target.value));
                      setSelectedTransaction(transaction || null);
                      setImpactAnalysis(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a transaction to delete</option>
                    {availableTransactions.map((transaction) => (
                      <option key={transaction.id} value={transaction.id}>
                        ID: {transaction.id} ({transaction.registration_number}) - ${transaction.amount.toFixed(2)} - {transaction.entity_name}
                      </option>
                    ))}
                  </select>
                ) : entityType ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 text-yellow-700">
                    No available transactions found for {entityType}. Create some transactions first.
                  </div>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Please select a transaction type first
                  </div>
                )}
                
                {selectedTransaction && (
                  <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded">
                    <strong>✅ Selected:</strong> {selectedTransaction.registration_number} - ${selectedTransaction.amount.toFixed(2)}
                    <br />
                    <strong>Entity:</strong> {selectedTransaction.entity_name}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={analyzeImpact}
                disabled={loading || !selectedTransaction}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Analyze Impact'}
              </button>
              
              {selectedTransaction && (
                <div className="text-sm text-gray-600">
                  Ready to analyze: {selectedTransaction.registration_number}
                </div>
              )}
            </div>

            {impactAnalysis && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Professional Impact Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(impactAnalysis.riskLevel)}`}>
                      {impactAnalysis.riskLevel} Risk
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Required Approvals</div>
                    <div className="font-medium">{impactAnalysis.requiredApprovals.join(' → ')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Estimated Time</div>
                    <div className="font-medium">{impactAnalysis.estimatedReversalTime} minutes</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Direct Impacts ({impactAnalysis.directImpacts.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {impactAnalysis.directImpacts.map((impact, index) => (
                        <div key={index} className="text-sm p-2 bg-white rounded border">
                          <div className="font-medium">{impact.type}</div>
                          <div className="text-gray-600">{impact.description}</div>
                          {impact.amount && (
                            <div className="text-blue-600">${impact.amount.toLocaleString()}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Cascade Impacts ({impactAnalysis.cascadeImpacts.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {impactAnalysis.cascadeImpacts.map((impact, index) => (
                        <div key={index} className="text-sm p-2 bg-white rounded border">
                          <div className="font-medium">{impact.type}</div>
                          <div className="text-gray-600">{impact.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deletion Reason *
                </label>
                <select
                  value={deletionReasonCode}
                  onChange={(e) => setDeletionReasonCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select deletion reason</option>
                  {deletionReasons.map((reason) => (
                    <option key={reason.reason_code} value={reason.reason_code}>
                      {reason.reason_name} {reason.requires_memo && '(requires memo)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Reason *
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief reason for deletion request"
                />
              </div>
            </div>

            {deletionReasons.find(r => r.reason_code === deletionReasonCode)?.requires_memo && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Memo *
                </label>
                <textarea
                  value={customMemo}
                  onChange={(e) => setCustomMemo(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed explanation required for this deletion reason"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={submitDeletionRequest}
                disabled={loading || !impactAnalysis}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{loading ? 'Submitting Request...' : 'Submit Deletion Request'}</span>
              </button>
              
              {impactAnalysis && !loading && (
                <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
                  ✅ Ready to submit - Impact analyzed
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Pending Approvals</h2>
              <p className="text-gray-600">Deletion requests awaiting your approval</p>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No pending approvals
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Step</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((approval) => (
                      <TableRow key={approval.step_id}>
                        <TableCell className="font-medium">{approval.request_number}</TableCell>
                        <TableCell>{approval.entity_type}</TableCell>
                        <TableCell>${approval.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(approval.risk_level)}`}>
                            {approval.risk_level}
                          </span>
                        </TableCell>
                        <TableCell>{approval.requester_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{approval.request_reason}</TableCell>
                        <TableCell>{approval.step_number} ({approval.approver_role})</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => processApprovalStep(approval.step_id, 'APPROVED')}
                              disabled={loading}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => processApprovalStep(approval.step_id, 'REJECTED')}
                              disabled={loading}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>My Deletion Requests</span>
                </h2>
                <p className="text-gray-600">Track your deletion requests and their approval status</p>
              </div>
              <button
                onClick={() => loadMyRequests()}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No deletion requests found</p>
                <p className="text-sm">Create your first deletion request using the "Request Deletion" tab</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.map((request) => (
                      <TableRow key={request.id} className={request.executed_at ? 'bg-blue-50' : ''}>
                        <TableCell className="font-medium">{request.request_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{request.entity_type}</span>
                            <span className="text-xs text-gray-500">ID: {request.entity_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>${request.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(getDisplayStatus(request))}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDisplayStatus(request))}`}>
                              {getDisplayStatus(request)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(request.risk_level)}`}>
                            {request.risk_level}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${(request.steps.filter(s => s.status === 'Approved').length / request.steps.length) * 100}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs whitespace-nowrap">
                                {request.steps.filter(s => s.status === 'Approved').length} / {request.steps.length}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {request.status === 'Approved' && !request.executed_at && (
                              <button
                                onClick={() => executeApprovedDeletion(request.id, request.request_number)}
                                disabled={loading}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                title="Execute this approved deletion"
                              >
                                <Play className="w-3 h-3" />
                                <span>Execute</span>
                              </button>
                            )}
                            {request.executed_at && (
                              <div className="flex items-center space-x-1 text-xs text-blue-600">
                                <CheckCircle className="w-3 h-3" />
                                <span>Completed</span>
                              </div>
                            )}
                            {request.status === 'Pending' && (
                              <div className="flex items-center space-x-1 text-xs text-yellow-600">
                                <Clock className="w-3 h-3" />
                                <span>Waiting</span>
                              </div>
                            )}
                            {request.status === 'Rejected' && (
                              <div className="flex items-center space-x-1 text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Rejected</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionDeletion;