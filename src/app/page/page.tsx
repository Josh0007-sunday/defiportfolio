"use client";
import React from 'react';
import dynamic from 'next/dynamic';
require('@solana/wallet-adapter-react-ui/styles.css');
import Header from '../component/header/page';
import Dashboard from '../component/dashboard/page';

const WalletContextProvider = dynamic(
  () => import('../component/web3/adapter').then(mod => mod.default),
  { ssr: false }
);

const HomePage: React.FC = () => {
  return (
    <WalletContextProvider>
      <Header />
      <Dashboard />
    </WalletContextProvider>
  );
};

export default HomePage;
