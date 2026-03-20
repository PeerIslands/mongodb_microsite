import { useState, useEffect } from 'react';
import {
  eventDomainsService,
  type WhitelistedDomain,
  type DomainRequest,
} from '@/api/services/eventDomains.service';
import '@/styles/features/admin/EventDomainManager.css';

type SubTab = 'whitelist' | 'requests';

interface Props {
  onPendingCountChange?: (count: number) => void;
}

const EventDomainManager = ({ onPendingCountChange }: Props) => {
  const [subTab, setSubTab] = useState<SubTab>('whitelist');

  // Whitelist state
  const [domains, setDomains] = useState<WhitelistedDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [loadingWhitelist, setLoadingWhitelist] = useState(true);

  // Requests state
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actioningDomain, setActioningDomain] = useState<string | null>(null);

  const fetchWhitelist = async () => {
    setLoadingWhitelist(true);
    try {
      const data = await eventDomainsService.listWhitelist();
      setDomains(data);
    } finally {
      setLoadingWhitelist(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await eventDomainsService.listRequests();
      setRequests(data);
      const pending = data.filter(r => r.status === 'pending').length;
      onPendingCountChange?.(pending);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => { fetchWhitelist(); }, []);
  useEffect(() => { fetchRequests(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (subTab === 'requests') fetchRequests(); }, [subTab]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomain.trim().toLowerCase().replace('@', '');
    if (!domain || !domain.includes('.')) {
      setAddError('Enter a valid domain e.g. mongodb.com');
      return;
    }
    setAddingDomain(true);
    setAddError(null);
    try {
      await eventDomainsService.addDomain(domain);
      setNewDomain('');
      await fetchWhitelist();
    } catch (err: any) {
      setAddError(err?.response?.data?.detail || 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleRemove = async (domain: string) => {
    if (!confirm(`Remove ${domain} from the whitelist?`)) return;
    try {
      await eventDomainsService.removeDomain(domain);
      setDomains(prev => prev.filter(d => d.domain !== domain));
    } catch {
      alert('Failed to remove domain');
    }
  };

  const handleApprove = async (domain: string) => {
    setActioningDomain(domain);
    try {
      await eventDomainsService.approveDomain(domain);
      setRequests(prev => prev.map(r => r.domain === domain ? { ...r, status: 'approved' } : r));
      await fetchWhitelist();
    } catch {
      alert('Failed to approve domain');
    } finally {
      setActioningDomain(null);
    }
  };

  const handleReject = async (domain: string) => {
    setActioningDomain(domain);
    try {
      await eventDomainsService.rejectDomain(domain);
      setRequests(prev => prev.map(r => r.domain === domain ? { ...r, status: 'rejected' } : r));
    } catch {
      alert('Failed to reject domain');
    } finally {
      setActioningDomain(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="edm">
      <h2 className="edm__title">Email Domain Access</h2>
      <p className="edm__desc">
        Control which email domains can register for events. Unrecognised domains are held for review — one notification per unique domain.
      </p>

      <div className="edm__tabs">
        <button
          className={`edm__tab ${subTab === 'whitelist' ? 'edm__tab--active' : ''}`}
          onClick={() => setSubTab('whitelist')}
        >
          Whitelisted Domains
          <span className="edm__tab-count">{domains.length}</span>
        </button>
        <button
          className={`edm__tab ${subTab === 'requests' ? 'edm__tab--active' : ''}`}
          onClick={() => setSubTab('requests')}
        >
          Access Requests
          {pendingCount > 0 && <span className="edm__tab-badge">{pendingCount}</span>}
        </button>
      </div>

      {/* ── Whitelist ──────────────────────────────────── */}
      {subTab === 'whitelist' && (
        <div className="edm__panel">
          <form onSubmit={handleAddDomain} className="edm__add-form">
            <input
              type="text"
              value={newDomain}
              onChange={e => { setNewDomain(e.target.value); setAddError(null); }}
              placeholder="e.g. mongodb.com"
              className="edm__input"
            />
            <button type="submit" className="edm__btn edm__btn--primary" disabled={addingDomain}>
              {addingDomain ? 'Adding…' : '+ Add Domain'}
            </button>
          </form>
          {addError && <p className="edm__error">{addError}</p>}

          {loadingWhitelist ? (
            <p className="edm__loading">Loading…</p>
          ) : domains.length === 0 ? (
            <p className="edm__empty">No domains whitelisted yet. All guest registrations will be blocked.</p>
          ) : (
            <table className="edm__table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {domains.map(d => (
                  <tr key={d.domain}>
                    <td className="edm__domain-cell">@{d.domain}</td>
                    <td className="edm__date-cell">{new Date(d.added_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="edm__btn edm__btn--danger"
                        onClick={() => handleRemove(d.domain)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Requests ──────────────────────────────────── */}
      {subTab === 'requests' && (
        <div className="edm__panel">
          {loadingRequests ? (
            <p className="edm__loading">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="edm__empty">No domain access requests yet.</p>
          ) : (
            <table className="edm__table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>First Request</th>
                  <th>Attempts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.domain} className={`edm__row--${r.status}`}>
                    <td className="edm__domain-cell">@{r.domain}</td>
                    <td className="edm__date-cell">{new Date(r.first_requested_at).toLocaleDateString()}</td>
                    <td className="edm__count-cell">{r.request_count}</td>
                    <td>
                      <span className={`edm__status edm__status--${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <div className="edm__action-btns">
                          <button
                            className="edm__btn edm__btn--approve"
                            disabled={actioningDomain === r.domain}
                            onClick={() => handleApprove(r.domain)}
                          >
                            Approve
                          </button>
                          <button
                            className="edm__btn edm__btn--danger"
                            disabled={actioningDomain === r.domain}
                            onClick={() => handleReject(r.domain)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <span className="edm__done-label">Added to whitelist</span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="edm__done-label">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDomainManager;
