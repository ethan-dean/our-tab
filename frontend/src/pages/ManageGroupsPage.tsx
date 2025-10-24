import React from 'react';
import { Link } from 'react-router-dom';
import GroupList from '../features/group/GroupList';
import Button from '../components/ui/Button';

const DashboardPage: React.FC = () => {
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Manage Your Groups</h1>
        <Link to="/add-group">
          <Button>+ Create Group</Button>
        </Link>
      </header>

      <GroupList />
    </div>
  );
};

export default DashboardPage;
