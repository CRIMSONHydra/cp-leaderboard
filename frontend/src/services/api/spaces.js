import { fetchJSON } from './client.js';

export const spacesApi = {
  createSpace: (name, description) =>
    fetchJSON('/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    }),

  getMySpaces: () =>
    fetchJSON('/spaces'),

  joinSpace: (inviteCode) =>
    fetchJSON('/spaces/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode })
    }),

  getSpace: (spaceId) =>
    fetchJSON(`/spaces/${spaceId}`),

  updateSpace: (spaceId, data) =>
    fetchJSON(`/spaces/${spaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  deleteSpace: (spaceId) =>
    fetchJSON(`/spaces/${spaceId}`, { method: 'DELETE' }),

  regenerateInviteCode: (spaceId) =>
    fetchJSON(`/spaces/${spaceId}/invite`, { method: 'POST' }),

  leaveSpace: (spaceId) =>
    fetchJSON(`/spaces/${spaceId}/leave`, { method: 'POST' }),

  getSpaceLeaderboard: (spaceId, sortBy = 'aggregate', order = 'desc') =>
    fetchJSON(`/spaces/${spaceId}/leaderboard?sortBy=${sortBy}&order=${order}`),

  addUserToSpace: (spaceId, userId) =>
    fetchJSON(`/spaces/${spaceId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }),

  createAndTrackUser: (spaceId, userData) =>
    fetchJSON(`/spaces/${spaceId}/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),

  updateTrackedUser: (spaceId, userId, handles) =>
    fetchJSON(`/spaces/${spaceId}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handles })
    }),

  removeUserFromSpace: (spaceId, userId) =>
    fetchJSON(`/spaces/${spaceId}/users/${userId}`, { method: 'DELETE' }),

  getMembers: (spaceId) =>
    fetchJSON(`/spaces/${spaceId}/members`),

  updateMemberRole: (spaceId, accountId, role) =>
    fetchJSON(`/spaces/${spaceId}/members/${accountId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    }),

  removeMember: (spaceId, accountId) =>
    fetchJSON(`/spaces/${spaceId}/members/${accountId}`, { method: 'DELETE' }),

  searchUsers: (query) =>
    fetchJSON(`/spaces/users/search?q=${encodeURIComponent(query)}`),

  // Invitations
  sendInvitation: (spaceId, email, role) =>
    fetchJSON(`/spaces/${spaceId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    }),

  getMyInvitations: () =>
    fetchJSON('/spaces/invitations/pending'),

  acceptInvitation: (invitationId) =>
    fetchJSON(`/spaces/invitations/${invitationId}/accept`, { method: 'POST' }),

  declineInvitation: (invitationId) =>
    fetchJSON(`/spaces/invitations/${invitationId}/decline`, { method: 'POST' }),

  getSpaceInvitations: (spaceId) =>
    fetchJSON(`/spaces/${spaceId}/invitations`),

  cancelInvitation: (spaceId, invitationId) =>
    fetchJSON(`/spaces/${spaceId}/invitations/${invitationId}`, { method: 'DELETE' }),

  searchAccounts: (spaceId, email) =>
    fetchJSON(`/spaces/${spaceId}/accounts/search?email=${encodeURIComponent(email)}`)
};
