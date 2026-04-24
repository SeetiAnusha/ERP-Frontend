/**
 * Bank Register Test Component
 * Minimal version to diagnose white page issue
 */

import { useLocation } from 'react-router-dom';

const BankRegisterTest = () => {
  const location = useLocation();
  
  console.log('🔍 BankRegisterTest - Location:', location);
  console.log('🔍 BankRegisterTest - State:', location.state);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Bank Register Test Page</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h2 className="font-bold mb-2">✅ Component Loaded Successfully!</h2>
        <p>If you can see this, the component is rendering.</p>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="font-bold mb-2">Location State:</h2>
        <pre className="bg-white p-3 rounded text-sm overflow-auto">
          {JSON.stringify(location.state, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default BankRegisterTest;
