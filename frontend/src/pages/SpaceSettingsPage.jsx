import { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { spacesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSpace } from '../hooks/useSpace';
import { useSpaceMembers } from '../hooks/useSpaceMembers';
import InviteCodeDisplay from '../components/Spaces/InviteCodeDisplay';
import InviteMemberModal from '../components/Spaces/InviteMemberModal';
import SpaceInvitationsList from '../components/Spaces/SpaceInvitationsList';
import MemberList from '../components/Spaces/MemberList';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import './SpaceSettingsPage.css';

export default function SpaceSettingsPage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { account } = useAuth();

  const { space, loading, error, setSpace } = useSpace(spaceId);
  const { members, refetch: refetchMembers } = useSpaceMembers(spaceId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationsKey, setInvitationsKey] = useState(0);
  const seededSpaceIdRef = useRef(null);

  // Only seed form fields when the space identity changes, not on every object update
  useEffect(() => {
    if (space && space._id !== seededSpaceIdRef.current) {
      seededSpaceIdRef.current = space._id;
      setName(space.name);
      setDescription(space.description || '');
    }
  }, [space]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const isOwner = space?.owner?._id === account?.id || space?.owner === account?.id;
  const isAdmin = space?.myRole === 'admin';

  if (!isAdmin) {
    return <Navigate to={`/spaces/${spaceId}`} replace />;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await spacesApi.updateSpace(spaceId, { name, description });
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateInvite = async () => {
    try {
      const res = await spacesApi.regenerateInviteCode(spaceId);
      setSpace(prev => ({ ...prev, inviteCode: res.data.inviteCode }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this space? This cannot be undone.')) return;
    try {
      await spacesApi.deleteSpace(spaceId);
      navigate('/spaces', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this space?')) return;
    try {
      await spacesApi.leaveSpace(spaceId);
      navigate('/spaces', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRoleChange = async (accountId, newRole) => {
    await spacesApi.updateMemberRole(spaceId, accountId, newRole);
    refetchMembers();
  };

  const handleRemoveMember = async (accountId) => {
    await spacesApi.removeMember(spaceId, accountId);
    refetchMembers();
  };

  return (
    <div className="space-settings-page">
      <div className="settings-nav">
        <Link to={`/spaces/${spaceId}`} className="back-link">Back to Space</Link>
      </div>

      <h1>Space Settings</h1>

      <section className="settings-section">
        <h2>General</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="settings-name">Name</label>
            <input
              type="text"
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="settings-desc">Description</label>
            <textarea
              id="settings-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveMsg && <span className="save-msg">{saveMsg}</span>}
          </div>
        </form>
      </section>

      <section className="settings-section">
        <h2>Invite Code</h2>
        <div className="invite-section">
          {space?.inviteCode && <InviteCodeDisplay code={space.inviteCode} />}
          <button onClick={handleRegenerateInvite} className="btn btn-secondary">
            Regenerate Code
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-header-row">
          <div>
            <h2>Members</h2>
            <p className="section-hint">People with access to this space. Invite by email to add viewers or admins.</p>
          </div>
          <button onClick={() => setShowInviteModal(true)} className="btn btn-primary">
            Invite Member
          </button>
        </div>
        <MemberList
          members={members}
          isAdmin={isAdmin}
          ownerId={space?.owner?._id || space?.owner}
          currentAccountId={account?.id}
          onRoleChange={handleRoleChange}
          onRemove={handleRemoveMember}
        />
        <SpaceInvitationsList key={invitationsKey} spaceId={spaceId} />
      </section>

      {showInviteModal && (
        <InviteMemberModal
          spaceId={spaceId}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => setInvitationsKey(k => k + 1)}
        />
      )}

      <section className="settings-section danger-zone">
        <h2>Danger Zone</h2>
        {isOwner ? (
          <button onClick={handleDelete} className="btn btn-danger">
            Delete Space
          </button>
        ) : (
          <button onClick={handleLeave} className="btn btn-danger">
            Leave Space
          </button>
        )}
      </section>
    </div>
  );
}
