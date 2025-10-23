import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SubPageNavbar from '../components/layout/SubPageNavbar';
import PageLayout from '../components/layout/PageLayout';

const SubPageLayout: React.FC = () => {
  const [title, setTitle] = useState('');

  return (
    <>
      <SubPageNavbar title={title} />
      <PageLayout>
        <Outlet context={{ setTitle }} />
      </PageLayout>
    </>
  );
};

export default SubPageLayout;
