import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Filter, Search, PlusCircle, Calendar, Clock, Wallet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { useMeetings } from '../../context/MeetingContext';
import { useWallet } from '../../context/WalletContext';
import { entrepreneurs, findUserById } from '../../data/users';
import { getRequestsFromInvestor } from '../../data/collaborationRequests';
import { format } from 'date-fns';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { requests: meetingRequests } = useMeetings();
  const { getBalance } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  if (!user) return null;

  const confirmedMeetings = meetingRequests
    .filter(r => (r.ownerId === user.id || r.requesterId === user.id) && r.status === 'confirmed')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3);

  const pendingMeetingRequests = meetingRequests.filter(
    r => r.ownerId === user.id && r.status === 'pending'
  ).length;
  
  // Get collaboration requests sent by this investor
  const sentRequests = getRequestsFromInvestor(user.id);
  const requestedEntrepreneurIds = sentRequests.map(req => req.entrepreneurId);
  
  // Filter entrepreneurs based on search and industry filters
  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.pitchSummary.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Industry filter
    const matchesIndustry = selectedIndustries.length === 0 || 
      selectedIndustries.includes(entrepreneur.industry);
    
    return matchesSearch && matchesIndustry;
  });
  
  // Get unique industries for filter
  const industries = Array.from(new Set(entrepreneurs.map(e => e.industry)));
  
  // Toggle industry selection
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prevSelected => 
      prevSelected.includes(industry)
        ? prevSelected.filter(i => i !== industry)
        : [...prevSelected, industry]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        
        <Link to="/entrepreneurs">
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            View All Startups
          </Button>
        </Link>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>
        
        <div className="w-full md:w-1/3">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            
            <div className="flex flex-wrap gap-2">
              {industries.map(industry => (
                <Badge
                  key={industry}
                  variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                  className="cursor-pointer"
                  onClick={() => toggleIndustry(industry)}
                >
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {confirmedMeetings.length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Link to="/payments">
          <Card className="bg-success-50 border border-success-100 hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardBody>
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <Wallet size={20} className="text-success-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-success-700">Wallet Balance</p>
                  <h3 className="text-xl font-semibold text-success-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(getBalance(user.id) / 100)}
                  </h3>
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Confirmed meetings panel */}
      {confirmedMeetings.length > 0 && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Meetings</h2>
            <Link to="/calendar" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View calendar
            </Link>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {confirmedMeetings.map(meeting => {
                const isOwner = meeting.ownerId === user.id;
                const other = findUserById(isOwner ? meeting.requesterId : meeting.ownerId);
                return (
                  <Link to="/calendar" key={meeting.id}>
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                      {other && (
                        <img src={other.avatarUrl} alt={other.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{meeting.title}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Clock size={11} />
                          <span>{format(new Date(meeting.start), 'MMM d')} · {format(new Date(meeting.start), 'h:mm a')}</span>
                        </div>
                        {other && <p className="text-xs text-gray-400 mt-0.5">{other.name}</p>}
                      </div>
                      <Badge variant="success" size="sm">Confirmed</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pending requests notice */}
      {pendingMeetingRequests > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Clock size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            You have <span className="font-semibold">{pendingMeetingRequests}</span> pending meeting{pendingMeetingRequests > 1 ? 's' : ''} awaiting your response.
          </p>
          <Link to="/calendar" className="ml-auto shrink-0">
            <Button size="sm" variant="outline">Review</Button>
          </Link>
        </div>
      )}
      
      {/* Entrepreneurs grid */}
      <div>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
          </CardHeader>
          
          <CardBody>
            {filteredEntrepreneurs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntrepreneurs.map(entrepreneur => (
                  <EntrepreneurCard
                    key={entrepreneur.id}
                    entrepreneur={entrepreneur}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No startups match your filters</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustries([]);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};