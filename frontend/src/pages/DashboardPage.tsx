import React, { useState } from 'react';
import GroupList from '../features/group/GroupList';
import CreateGroupForm from '../features/group/CreateGroupForm';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Your Groups</h1>
        <Button onClick={() => setIsModalOpen(true)}>+ Create Group</Button>
      </header>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateGroupForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>

      <GroupList />
    </div>
  );
};

export default DashboardPage;