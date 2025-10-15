import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageLayout from '../components/layout/PageLayout';

const RootLayout: React.FC = () => {
  return (
    <>
      <Navbar />
      <PageLayout>
        <Outlet />
      </PageLayout>
    </>
  );
};

export default RootLayout;