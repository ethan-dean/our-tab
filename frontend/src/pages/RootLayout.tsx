import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import SubPageNavbar from '../components/layout/SubPageNavbar';
import PageLayout from '../components/layout/PageLayout';

const RootLayout: React.FC = () => {
  const location = useLocation();
  const isSubPage = 
    location.pathname.includes('/post/') || 
    location.pathname.includes('/notifications') || 
    location.pathname.includes('/profile');

  return (
    <>
      {isSubPage ? <SubPageNavbar /> : <Navbar />}
      <PageLayout>
        <Outlet />
      </PageLayout>
    </>
  );
};

export default RootLayout;