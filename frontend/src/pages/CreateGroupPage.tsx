import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreateGroupForm from '../features/group/CreateGroupForm';

const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <CreateGroupForm onSuccess={() => navigate('/manage-groups')} />
    </div>
  );
};

export default CreateGroupPage;
