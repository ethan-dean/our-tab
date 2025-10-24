import React from 'react';
import { Link } from 'react-router-dom';
import GroupList from '../features/group/GroupList';
import Button from '../components/ui/Button';

const DashboardPage: React.FC = () => {
  return (
    <div>
      <header>
        <h1>Manage Groups</h1>
      </header>

      <Link to="/add-group">
        <Button>+ Create Group</Button>
      </Link>

      <GroupList />
    </div>
  );
};

export default DashboardPage;
