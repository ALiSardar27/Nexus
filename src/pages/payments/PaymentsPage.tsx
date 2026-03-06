import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  Users,
  Search,
  Filter,
  Landmark,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { findUserById, entrepreneurs } from '../../data/users';
import { TransactionType, TransactionStatus } from '../../types';
import { format } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
};

const TXN_TYPE_CONFIG: Record<TransactionType, { label: string; icon: React.ReactNode; color: string }> = {
  deposit: { label: 'Deposit', icon: <ArrowDownLeft size={14} />, color: 'text-green-600' },
  withdraw: { label: 'Withdrawal', icon: <ArrowUpRight size={14} />, color: 'text-red-500' },
  transfer: { label: 'Transfer', icon: <ArrowLeftRight size={14} />, color: 'text-blue-600' },
  funding: { label: 'Funding', icon: <DollarSign size={14} />, color: 'text-purple-600' },
};

const TXN_STATUS_CONFIG: Record<TransactionStatus, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  completed: { label: 'Completed', variant: 'success', icon: <CheckCircle2 size={12} /> },
  pending: { label: 'Pending', variant: 'warning', icon: <Clock size={12} /> },
  failed: { label: 'Failed', variant: 'error', icon: <XCircle size={12} /> },
};

// ── Transaction Modal ─────────────────────────────────────────────────────────

type ModalAction = 'deposit' | 'withdraw' | 'transfer' | 'fund';

interface TxnModalProps {
  action: ModalAction;
  userId: string;
  userRole: string;
  balance: number;
  onSubmit: (amount: number, recipientId: string, description: string) => void;
  onClose: () => void;
}

const TxnModal: React.FC<TxnModalProps> = ({ action, userId, userRole, balance, onSubmit, onClose }) => {
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const needsRecipient = action === 'transfer' || action === 'fund';
  const amountCents = Math.round(parseFloat(amount || '0') * 100);

  const titles: Record<ModalAction, string> = {
    deposit: 'Deposit Funds',
    withdraw: 'Withdraw Funds',
    transfer: 'Transfer Funds',
    fund: 'Fund a Startup',
  };

  const icons: Record<ModalAction, React.ReactNode> = {
    deposit: <ArrowDownLeft size={20} className="text-green-600" />,
    withdraw: <ArrowUpRight size={20} className="text-red-500" />,
    transfer: <ArrowLeftRight size={20} className="text-blue-600" />,
    fund: <Landmark size={20} className="text-purple-600" />,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if ((action === 'withdraw' || action === 'transfer' || action === 'fund') && amountCents > balance) {
      setError('Insufficient balance');
      return;
    }
    if (needsRecipient && !recipientId) {
      setError('Select a recipient');
      return;
    }
    onSubmit(amountCents, recipientId || userId, description || titles[action]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header with stripe-style gradient */}
        <div className="relative overflow-hidden rounded-t-xl">
          <div className={`px-6 py-5 ${
            action === 'deposit' ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
            action === 'withdraw' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            action === 'transfer' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
            'bg-gradient-to-r from-purple-600 to-violet-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  {icons[action]}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{titles[action]}</h2>
                  <p className="text-xs text-white/70">Balance: {fmtCurrency(balance)}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (USD)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              />
            </div>
            {/* Quick amounts */}
            <div className="flex gap-2 mt-2">
              {[100, 500, 1000, 5000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="flex-1 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  ${v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient */}
          {needsRecipient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {action === 'fund' ? 'Startup to Fund' : 'Recipient'}
              </label>
              <select
                value={recipientId}
                onChange={(e) => { setRecipientId(e.target.value); setError(''); }}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {(action === 'fund' ? entrepreneurs : entrepreneurs).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{action === 'fund' && 'startupName' in u ? ` — ${u.startupName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={action === 'fund' ? 'e.g. Series A funding' : 'Optional note'}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mock payment method */}
          <div className="border rounded-lg p-3 bg-gray-50 flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-center">
              <CreditCard size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">Visa ending in 4242</p>
              <p className="text-[10px] text-gray-400">Mock payment method</p>
            </div>
            <Badge variant="gray" size="sm">Default</Badge>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={onClose}>Cancel</Button>
            <Button type="submit" fullWidth>
              {action === 'deposit' ? 'Deposit' :
               action === 'withdraw' ? 'Withdraw' :
               action === 'transfer' ? 'Transfer' :
               'Send Funding'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { getBalance, getTransactionsForUser, deposit, withdraw, transfer, fund } = useWallet();
  const [modal, setModal] = useState<ModalAction | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');

  if (!user) return null;

  const balance = getBalance(user.id);
  const transactions = getTransactionsForUser(user.id);

  const filtered = transactions.filter((t) => {
    const matchSearch = search === '' ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      findUserById(t.senderId)?.name.toLowerCase().includes(search.toLowerCase()) ||
      findUserById(t.receiverId)?.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalIn = transactions
    .filter((t) => t.receiverId === user.id && t.status === 'completed')
    .reduce((a, t) => a + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.senderId === user.id && t.senderId !== t.receiverId && t.status === 'completed')
    .reduce((a, t) => a + t.amount, 0);

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  const handleSubmit = (action: ModalAction, amount: number, recipientId: string, desc: string) => {
    switch (action) {
      case 'deposit':
        deposit(user.id, amount, desc);
        break;
      case 'withdraw':
        withdraw(user.id, amount, desc);
        break;
      case 'transfer':
        transfer(user.id, recipientId, amount, desc);
        break;
      case 'fund':
        fund(user.id, recipientId, amount, desc);
        break;
    }
    setModal(null);
  };

  const isInvestor = user.role === 'investor';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Manage your wallet, transactions, and funding deals</p>
        </div>
      </div>

      {/* Wallet hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Balance card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={20} className="text-gray-400" />
              <span className="text-sm text-gray-400">Wallet Balance</span>
            </div>
            <p className="text-3xl font-bold tracking-tight">{fmtCurrency(balance)}</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp size={12} className="text-green-400" />
                <span className="text-green-300">{fmtCurrency(totalIn)} in</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingDown size={12} className="text-red-400" />
                <span className="text-red-300">{fmtCurrency(totalOut)} out</span>
              </div>
            </div>

            {/* Mock card visual */}
            <div className="mt-6 bg-white/10 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                <CreditCard size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80">Visa •••• 4242</p>
                <p className="text-[10px] text-white/50">Expires 12/27</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { action: 'deposit' as const, icon: <ArrowDownLeft size={22} />, label: 'Deposit', desc: 'Add funds to wallet', bg: 'bg-green-50 hover:bg-green-100 border-green-200', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
            { action: 'withdraw' as const, icon: <ArrowUpRight size={22} />, label: 'Withdraw', desc: 'Cash out to bank', bg: 'bg-red-50 hover:bg-red-100 border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-500' },
            { action: 'transfer' as const, icon: <ArrowLeftRight size={22} />, label: 'Transfer', desc: 'Send to another user', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
            { action: 'fund' as const, icon: <Landmark size={22} />, label: isInvestor ? 'Fund Startup' : 'Request Funding', desc: isInvestor ? 'Invest in a startup' : 'Simulate inbound deal', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
          ]).map(({ action, icon, label, desc, bg, iconBg, iconColor }) => (
            <button
              key={action}
              onClick={() => setModal(action)}
              className={`flex flex-col items-center text-center p-5 rounded-xl border transition-colors ${bg}`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-3 ${iconColor}`}>
                {icon}
              </div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Received', value: fmtCurrency(totalIn), icon: <ArrowDownLeft size={16} />, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Total Sent', value: fmtCurrency(totalOut), icon: <ArrowUpRight size={16} />, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
          { label: 'Transactions', value: String(transactions.length), icon: <CreditCard size={16} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Pending', value: String(pendingCount), icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`rounded-lg border p-3 ${bg}`}>
            <div className="flex items-center gap-2">
              <span className={color}>{icon}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                />
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'deposit', 'withdraw', 'transfer', 'funding'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      typeFilter === t
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'all' ? 'All' : TXN_TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <AlertCircle size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No transactions found</p>
              <p className="text-xs text-gray-400 mt-1">Make a deposit to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From / To</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((txn) => {
                    const tcfg = TXN_TYPE_CONFIG[txn.type];
                    const scfg = TXN_STATUS_CONFIG[txn.status];
                    const sender = findUserById(txn.senderId);
                    const receiver = findUserById(txn.receiverId);
                    const isIncoming = txn.receiverId === user.id && txn.senderId !== user.id;

                    return (
                      <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`flex items-center gap-2 ${tcfg.color}`}>
                            {tcfg.icon}
                            <span className="text-xs font-medium">{tcfg.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900 truncate max-w-[200px]">{txn.description}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {sender && (
                              <div className="flex items-center gap-1.5">
                                <img src={sender.avatarUrl} alt={sender.name} className="w-5 h-5 rounded-full object-cover" />
                                <span className="text-xs text-gray-600">{sender.id === user.id ? 'You' : sender.name}</span>
                              </div>
                            )}
                            {txn.senderId !== txn.receiverId && (
                              <>
                                <span className="text-xs text-gray-400">→</span>
                                {receiver && (
                                  <div className="flex items-center gap-1.5">
                                    <img src={receiver.avatarUrl} alt={receiver.name} className="w-5 h-5 rounded-full object-cover" />
                                    <span className="text-xs text-gray-600">{receiver.id === user.id ? 'You' : receiver.name}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={`text-sm font-semibold ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}>
                            {isIncoming ? '+' : txn.senderId !== txn.receiverId ? '-' : ''}
                            {fmtCurrency(txn.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <Badge variant={scfg.variant} size="sm">
                            <span className="flex items-center gap-1">
                              {scfg.icon} {scfg.label}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-xs text-gray-500">
                            {format(new Date(txn.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal */}
      {modal && (
        <TxnModal
          action={modal}
          userId={user.id}
          userRole={user.role}
          balance={balance}
          onSubmit={(amount, recipientId, desc) => handleSubmit(modal, amount, recipientId, desc)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};
