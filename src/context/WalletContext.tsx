import React, { createContext, useContext, useState, useCallback } from 'react';
import { WalletTransaction } from '../types';
import * as walletData from '../data/wallet';

interface WalletContextValue {
  getBalance: (userId: string) => number;
  transactions: WalletTransaction[];
  getTransactionsForUser: (userId: string) => WalletTransaction[];
  deposit: (userId: string, amount: number, description: string) => void;
  withdraw: (userId: string, amount: number, description: string) => void;
  transfer: (senderId: string, receiverId: string, amount: number, description: string) => void;
  fund: (investorId: string, entrepreneurId: string, amount: number, description: string) => void;
}

const uid = () => 'txn-' + Math.random().toString(36).slice(2, 10);

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const getBalance = useCallback((userId: string) => walletData.getBalance(userId), []);

  const transactions = walletData.getTransactions();

  const getTransactionsForUser = useCallback(
    (userId: string) => walletData.getTransactionsForUser(userId),
    []
  );

  const deposit = useCallback((userId: string, amount: number, description: string) => {
    walletData.setBalance(userId, walletData.getBalance(userId) + amount);
    walletData.addTransaction({
      id: uid(),
      type: 'deposit',
      amount,
      senderId: userId,
      receiverId: userId,
      description,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
    bump();
  }, []);

  const withdraw = useCallback((userId: string, amount: number, description: string) => {
    walletData.setBalance(userId, Math.max(0, walletData.getBalance(userId) - amount));
    walletData.addTransaction({
      id: uid(),
      type: 'withdraw',
      amount,
      senderId: userId,
      receiverId: userId,
      description,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
    bump();
  }, []);

  const transfer = useCallback(
    (senderId: string, receiverId: string, amount: number, description: string) => {
      walletData.setBalance(senderId, Math.max(0, walletData.getBalance(senderId) - amount));
      walletData.setBalance(receiverId, walletData.getBalance(receiverId) + amount);
      walletData.addTransaction({
        id: uid(),
        type: 'transfer',
        amount,
        senderId,
        receiverId,
        description,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      bump();
    },
    []
  );

  const fund = useCallback(
    (investorId: string, entrepreneurId: string, amount: number, description: string) => {
      walletData.setBalance(investorId, Math.max(0, walletData.getBalance(investorId) - amount));
      walletData.setBalance(entrepreneurId, walletData.getBalance(entrepreneurId) + amount);
      walletData.addTransaction({
        id: uid(),
        type: 'funding',
        amount,
        senderId: investorId,
        receiverId: entrepreneurId,
        description,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      bump();
    },
    []
  );

  return (
    <WalletContext.Provider
      value={{ getBalance, transactions, getTransactionsForUser, deposit, withdraw, transfer, fund }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextValue => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
  return ctx;
};
