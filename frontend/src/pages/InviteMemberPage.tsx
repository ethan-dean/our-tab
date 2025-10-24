import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import InviteForm from '../features/group/InviteForm';

const InviteMemberPage: React.FC = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  if (!groupId) {
    return <p>Group not found.</p>;
  }

  return (
    <div>
      <InviteForm groupId={groupId} onSuccess={() => navigate(`/group/${groupId}`)} />
    </div>
  );
};

export default InviteMemberPage;
