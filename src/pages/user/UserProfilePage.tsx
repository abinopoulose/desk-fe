import React from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useUserProfile } from '../../hooks/useUserProfile';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const {
    profile,
    loading,
    error,
    isEditing,
    refetch,
  } = useUserProfile(userId);

  if (loading) {
    return (
      <div data-testid="loading-skeleton" className="p-6 space-y-6">
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error === '404') {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-xl font-bold mb-4">Error Loading Profile</h2>
        <p>{error}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-6 border">
        <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-3xl font-bold">
          {profile.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold">{profile.fullName}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {profile.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-gray-600 text-lg">{profile.title || 'No Title'}</p>
          <p className="text-gray-500">{profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manager Card */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Reporting Manager</h2>
          {profile.manager ? (
            <Link to={`/users/${profile.manager.id}`} className="block hover:bg-gray-50 p-3 rounded border">
              <div className="font-medium text-blue-600">{profile.manager.fullName}</div>
              <div className="text-gray-600 text-sm">{profile.manager.title || 'No Title'}</div>
            </Link>
          ) : (
            <p className="text-gray-500 italic">No manager assigned (Root node)</p>
          )}
        </div>

        {/* Assigned Roles Card */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assigned Roles</h2>
          {profile.roles && profile.roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border">
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No roles assigned</p>
          )}
        </div>

        {/* Direct Reportees Card */}
        <div className="bg-white p-6 rounded-lg shadow border md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Direct Reportees ({profile.reportees?.length || 0})</h2>
          {profile.reportees && profile.reportees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {profile.reportees.map(reportee => (
                <Link key={reportee.id} to={`/users/${reportee.id}`} className="block hover:bg-gray-50 p-3 rounded border">
                  <div className="font-medium text-blue-600">{reportee.fullName}</div>
                  <div className="text-gray-600 text-sm">{reportee.title || 'No Title'}</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No direct reports</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
