import React, { useState } from 'react';
import { runMigration } from '../firebase/migrateData';

const MigrationButton = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus('Starting migration...');
    
    try {
      await runMigration();
      setMigrationStatus('✅ Migration completed successfully!');
    } catch (error) {
      setMigrationStatus(`❌ Migration failed: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h3 className="text-lg font-semibold mb-2">Firebase Migration</h3>
      <p className="text-sm text-gray-600 mb-4">
        Click the button below to migrate your existing menu data to Firebase.
        This only needs to be done once.
      </p>
      <button
        onClick={handleMigration}
        disabled={isMigrating}
        className={`px-4 py-2 rounded ${
          isMigrating 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isMigrating ? 'Migrating...' : 'Run Migration'}
      </button>
      {migrationStatus && (
        <p className={`mt-2 text-sm ${
          migrationStatus.includes('✅') ? 'text-green-600' : 'text-red-600'
        }`}>
          {migrationStatus}
        </p>
      )}
    </div>
  );
};

export default MigrationButton;
