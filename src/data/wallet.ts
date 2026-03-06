import { WalletTransaction } from '../types';

const now = new Date();
const ago = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

// Per-user balances (userId → cents)
let _balances: Record<string, number> = {
  e1: 1250000,  // $12,500
  e2: 830000,   // $8,300
  e3: 450000,   // $4,500
  e4: 670000,   // $6,700
  i1: 5000000,  // $50,000
  i2: 7500000,  // $75,000
  i3: 3200000,  // $32,000
};

let _transactions: WalletTransaction[] = [
  {
    id: 'txn-1',
    type: 'funding',
    amount: 1500000,
    senderId: 'i1',
    receiverId: 'e1',
    description: 'Series A Funding — TechWave AI',
    status: 'completed',
    createdAt: ago(2),
  },
  {
    id: 'txn-2',
    type: 'deposit',
    amount: 500000,
    senderId: 'i2',
    receiverId: 'i2',
    description: 'Account top-up via Stripe',
    status: 'completed',
    createdAt: ago(12),
  },
  {
    id: 'txn-3',
    type: 'funding',
    amount: 800000,
    senderId: 'i3',
    receiverId: 'e3',
    description: 'Seed Funding — HealthPulse',
    status: 'completed',
    createdAt: ago(48),
  },
  {
    id: 'txn-4',
    type: 'withdraw',
    amount: 200000,
    senderId: 'e1',
    receiverId: 'e1',
    description: 'Withdrawal to bank account',
    status: 'completed',
    createdAt: ago(72),
  },
  {
    id: 'txn-5',
    type: 'transfer',
    amount: 50000,
    senderId: 'e1',
    receiverId: 'e2',
    description: 'Team collaboration payment',
    status: 'completed',
    createdAt: ago(96),
  },
  {
    id: 'txn-6',
    type: 'funding',
    amount: 2000000,
    senderId: 'i2',
    receiverId: 'e2',
    description: 'Seed Funding — GreenLife Solutions',
    status: 'pending',
    createdAt: ago(1),
  },
  {
    id: 'txn-7',
    type: 'deposit',
    amount: 100000,
    senderId: 'e3',
    receiverId: 'e3',
    description: 'Account top-up via PayPal',
    status: 'completed',
    createdAt: ago(120),
  },
  {
    id: 'txn-8',
    type: 'funding',
    amount: 500000,
    senderId: 'i1',
    receiverId: 'e4',
    description: 'Pre-seed Funding — UrbanFarm',
    status: 'failed',
    createdAt: ago(168),
  },
];

// ── Read helpers ──────────────────────────────────────────────────────────────

export const getBalance = (userId: string): number =>
  _balances[userId] ?? 0;

export const getTransactions = (): WalletTransaction[] => [..._transactions];

export const getTransactionsForUser = (userId: string): WalletTransaction[] =>
  _transactions.filter((t) => t.senderId === userId || t.receiverId === userId);

// ── Write helpers ─────────────────────────────────────────────────────────────

export const setBalance = (userId: string, cents: number) => {
  _balances = { ..._balances, [userId]: cents };
};

export const addTransaction = (txn: WalletTransaction) => {
  _transactions = [txn, ..._transactions];
};
