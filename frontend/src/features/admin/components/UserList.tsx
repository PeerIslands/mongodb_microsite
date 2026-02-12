import { useState, useEffect, useRef } from 'react';
import '@/styles/features/admin/UserList.css';
import { userService, GetUsersFilters } from '@/api/services/user.service';
import type { User, UserStats } from '@/types/models/user';
import { useToast } from '@/contexts/ToastContext';

interface UserListProps {
  // No add/edit functionality for users - they register themselves
  onLoadComplete?: () => void;
}

const UserList = ({ onLoadComplete }: UserListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admin: 0,
    internal: 0,
    external: 0,
    active: 0,
    pending_mfa: 0,
    completed: 0,
    deleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GetUsersFilters>({});
  const [filteredCount, setFilteredCount] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });

  const { showToast } = useToast();

  // Ref to prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch users on component mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchUsers();
  }, []);

  // Fetch users when filters change
  useEffect(() => {
    if (!hasFetchedRef.current) return;
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAllUsers(filters);
      // Map _id to id for frontend compatibility
      const mappedUsers = data.users.map((user: any) => ({
        ...user,
        id: user._id || user.id,
      }));
      setUsers(mappedUsers);
      setStats(data.stats);
      setFilteredCount(data.filtered_count);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      onLoadComplete?.();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm });
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters };
    if (value === 'all') {
      delete newFilters[key as keyof GetUsersFilters];
    } else {
      (newFilters as any)[key] = value;
    }
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
  };

  const handleToggleAdmin = (user: User) => {
    if (!user.is_internal) {
      showToast('Only internal users can be granted admin access.', 'warning');
      return;
    }

    const newAdminStatus = !user.is_admin;
    setConfirmModal({
      isOpen: true,
      title: newAdminStatus ? 'Grant Admin Access' : 'Revoke Admin Access',
      message: newAdminStatus
        ? `Are you sure you want to grant admin access to ${user.first_name} ${user.last_name}?`
        : `Are you sure you want to revoke admin access from ${user.first_name} ${user.last_name}?`,
      confirmText: newAdminStatus ? 'Grant Admin' : 'Revoke Admin',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setActionInProgress(user.id);
          await userService.toggleAdminStatus(user.id, newAdminStatus);
          showToast(`Admin access ${newAdminStatus ? 'granted to' : 'revoked from'} ${user.first_name} ${user.last_name}.`, 'success');
          fetchUsers();
        } catch (err: any) {
          console.error('Failed to toggle admin status:', err);
          showToast(err.response?.data?.detail || 'Failed to update admin status. Please try again.', 'error');
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleToggleBlock = (user: User) => {
    const newBlockStatus = user.account_active; // If active, we want to block
    setConfirmModal({
      isOpen: true,
      title: newBlockStatus ? 'Block User Access' : 'Restore User Access',
      message: newBlockStatus
        ? `Are you sure you want to block ${user.first_name} ${user.last_name}? They will not be able to log in.`
        : `Are you sure you want to restore access for ${user.first_name} ${user.last_name}?`,
      confirmText: newBlockStatus ? 'Block User' : 'Restore Access',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setActionInProgress(user.id);
          await userService.toggleBlockStatus(user.id, newBlockStatus);
          showToast(`${user.first_name} ${user.last_name}'s access has been ${newBlockStatus ? 'blocked' : 'restored'}.`, 'success');
          fetchUsers();
        } catch (err: any) {
          console.error('Failed to toggle block status:', err);
          showToast(err.response?.data?.detail || 'Failed to update block status. Please try again.', 'error');
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleDeleteUser = (user: User) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.first_name} ${user.last_name}?\n\nThis will allow their email to be reused for new registrations. This action cannot be undone.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setActionInProgress(user.id);
          await userService.deleteUser(user.id);
          showToast(`${user.first_name} ${user.last_name} has been deleted successfully.`, 'success');
          fetchUsers();
        } catch (err: any) {
          console.error('Failed to delete user:', err);
          showToast(err.response?.data?.detail || 'Failed to delete user. Please try again.', 'error');
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleCloseConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  if (loading && !hasFetchedRef.current) {
    return (
      <div className="user-list">
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchUsers} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-list">
      {/* Header Section */}
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Users</h2>
          <span className="list-count">
            {hasActiveFilters ? `${filteredCount} of ${stats.total}` : `${stats.total} Total`}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <div className="stat-value">{stats.admin}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-value">{stats.internal}</div>
            <div className="stat-label">Internal</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.external}</div>
            <div className="stat-label">External</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending_mfa}</div>
            <div className="stat-label">Pending MFA</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗑️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.deleted}</div>
            <div className="stat-label">Deleted</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        <div className="filter-group">
          <label>Role:</label>
          <select
            value={filters.is_admin === undefined ? 'all' : filters.is_admin ? 'admin' : 'user'}
            onChange={(e) => handleFilterChange('is_admin', e.target.value === 'all' ? 'all' : e.target.value === 'admin')}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filters.is_internal === undefined ? 'all' : filters.is_internal ? 'internal' : 'external'}
            onChange={(e) => handleFilterChange('is_internal', e.target.value === 'all' ? 'all' : e.target.value === 'internal')}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.registration_status || 'all'}
            onChange={(e) => handleFilterChange('registration_status', e.target.value === 'all' ? 'all' : e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending_mfa">Pending MFA</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-button">
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Registration Date</th>
              <th>Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading-row">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {hasActiveFilters ? 'No users match the selected filters.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="name-cell">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td>{user.user_email}</td>
                  <td>{user.company || '-'}</td>
                  <td>
                    <div className="date-cell">
                      <span className="date-text">{formatDate(user.created_at)}</span>
                      {user.registration_completed_at && (
                        <span className="completed-date" title="Completed">
                          ✓ {formatDate(user.registration_completed_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="info-icons">
                      <span 
                        className="info-icon" 
                        title={user.is_internal ? 'Internal User' : 'External User'}
                      >
                        {user.is_internal ? '🏢' : '🌐'}
                      </span>
                      <span 
                        className="info-icon" 
                        title={user.is_admin ? 'Admin' : 'User'}
                      >
                        {user.is_admin ? '🔑' : '👤'}
                      </span>
                      <span 
                        className="info-icon" 
                        title={user.registration_status === 'completed' ? 'Registration Completed' : 'Pending MFA'}
                      >
                        {user.registration_status === 'completed' ? '✅' : '⏳'}
                      </span>
                      {!user.account_active && user.registration_status === 'completed' && (
                        <span 
                          className="info-icon blocked" 
                          title="User is Blocked"
                        >
                          🚫
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-button edit"
                        onClick={() => handleEditUser(user)}
                        title="View User Details"
                        disabled={actionInProgress === user.id}
                      >
                        ✏️
                      </button>
                      {user.is_internal && (
                        <button
                          className={`action-button ${user.is_admin ? 'revoke-admin' : 'grant-admin'}`}
                          onClick={() => handleToggleAdmin(user)}
                          title={user.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                          disabled={actionInProgress === user.id}
                        >
                          {user.is_admin ? '👤' : '🔑'}
                        </button>
                      )}
                      <button
                        className={`action-button ${user.account_active ? 'block' : 'unblock'}`}
                        onClick={() => handleToggleBlock(user)}
                        title={user.account_active ? 'Block User' : 'Unblock User'}
                        disabled={actionInProgress === user.id}
                      >
                        {user.account_active ? '🚫' : '✅'}
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User"
                        disabled={actionInProgress === user.id}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="modal-close" onClick={handleCloseEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-row">
                <label>Name:</label>
                <span>{editingUser.first_name} {editingUser.last_name}</span>
              </div>
              <div className="user-detail-row">
                <label>Email:</label>
                <span>{editingUser.original_email || editingUser.user_email}</span>
              </div>
              {editingUser.is_deleted && editingUser.original_email && (
                <div className="user-detail-row">
                  <label>Status Note:</label>
                  <span className="deleted-note">This user was deleted. Original email is now available for new registrations.</span>
                </div>
              )}
              <div className="user-detail-row">
                <label>Company:</label>
                <span>{editingUser.company || '-'}</span>
              </div>
              <div className="user-detail-row">
                <label>Job Function:</label>
                <span>{editingUser.job_function || '-'}</span>
              </div>
              <div className="user-detail-row">
                <label>Business Phone:</label>
                <span>{editingUser.business_phone || '-'}</span>
              </div>
              <div className="user-detail-row">
                <label>Country:</label>
                <span>{editingUser.country || '-'}</span>
              </div>
              <div className="user-detail-row">
                <label>Info:</label>
                <span className="info-badges">
                  <span className={`badge ${editingUser.is_internal ? 'internal' : 'external'}`}>
                    {editingUser.is_internal ? 'Internal' : 'External'}
                  </span>
                  <span className={`badge ${editingUser.is_admin ? 'admin' : 'user'}`}>
                    {editingUser.is_admin ? 'Admin' : 'User'}
                  </span>
                  <span className={`badge ${editingUser.registration_status === 'completed' ? 'completed' : 'pending'}`}>
                    {editingUser.registration_status === 'completed' ? 'Completed' : 'Pending MFA'}
                  </span>
                </span>
              </div>
              <div className="user-detail-row">
                <label>Account Active:</label>
                <span className={editingUser.account_active ? 'active-text' : 'blocked-text'}>
                  {editingUser.account_active ? 'Yes' : 'No (Blocked)'}
                </span>
              </div>
              <div className="user-detail-row">
                <label>Created:</label>
                <span>{formatDate(editingUser.created_at)}</span>
              </div>
              {editingUser.registration_completed_at && (
                <div className="user-detail-row">
                  <label>Registration Completed:</label>
                  <span>{formatDate(editingUser.registration_completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={handleCloseConfirmModal}>
          <div className="modal-content confirm-modal-image" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={handleCloseConfirmModal}>×</button>
            
            <div className="modal-icon-container">
              <div className={`modal-icon-circle ${
                confirmModal.title.includes('Delete') ? 'icon-delete' : 
                confirmModal.title.includes('Block') ? 'icon-block' : 
                confirmModal.title.includes('Restore') ? 'icon-restore' : 
                confirmModal.title.includes('Admin') || confirmModal.title.includes('Revoke') ? 'icon-admin' : 
                'icon-default'
              }`}>
                <span className="modal-icon-emoji">
                  {confirmModal.title.includes('Delete') ? '🗑️' : 
                   confirmModal.title.includes('Block') ? '🚫' : 
                   confirmModal.title.includes('Restore') ? '✅' : 
                   confirmModal.title.includes('Grant') ? '🔑' : 
                   confirmModal.title.includes('Revoke') ? '👤' : '⚠️'}
                </span>
              </div>
            </div>
            
            <div className="modal-content-center">
              <h3 className="modal-title-centered">{confirmModal.title}</h3>
              <p className="confirm-message-centered">{confirmModal.message}</p>
            </div>
            
            <div className="modal-actions-centered">
              <button 
                className="modal-button-secondary" 
                onClick={handleCloseConfirmModal}
              >
                {confirmModal.cancelText}
              </button>
              <button 
                className={`modal-button-primary ${
                  confirmModal.title.includes('Delete') || confirmModal.title.includes('Block') ? 'button-danger' : 
                  confirmModal.title.includes('Restore') || confirmModal.title.includes('Grant') ? 'button-success' : 
                  'button-default'
                }`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
