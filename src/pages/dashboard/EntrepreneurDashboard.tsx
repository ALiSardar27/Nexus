import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, Clock, Video, Wallet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { useMeetings } from '../../context/MeetingContext';
import { useWallet } from '../../context/WalletContext';
import { CollaborationRequest } from '../../types';
import { getRequestsForEntrepreneur } from '../../data/collaborationRequests';
import { investors, findUserById } from '../../data/users';
import { format } from 'date-fns';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const { requests: meetingRequests } = useMeetings();
  const { getBalance } = useWallet();
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [recommendedInvestors, setRecommendedInvestors] = useState(investors.slice(0, 3));

  useEffect(() => {
    if (user) {
      const requests = getRequestsForEntrepreneur(user.id);
      setCollaborationRequests(requests);
    }
  }, [user]);
  
  const handleRequestStatusUpdate = (requestId: string, status: 'accepted' | 'rejected') => {
    setCollaborationRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId ? { ...req, status } : req
      )
    );
  };
  
  if (!user) return null;

  const pendingRequests = collaborationRequests.filter(req => req.status === 'pending');

  const confirmedMeetings = meetingRequests
    .filter(r => (r.ownerId === user.id || r.requesterId === user.id) && r.status === 'confirmed')
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        
        <Link to="/investors">
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            Find Investors
          </Button>
        </Link>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Requests</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingRequests.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {collaborationRequests.filter(req => req.status === 'accepted').length}
                </h3>
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
                <h3 className="text-xl font-semibold text-accent-900">{confirmedMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Link to="/payments">
          <Card className="bg-success-50 border border-success-100 hover:shadow-md transition-shadow cursor-pointer">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collaboration requests */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
              <Badge variant="primary">{pendingRequests.length} pending</Badge>
            </CardHeader>
            
            <CardBody>
              {collaborationRequests.length > 0 ? (
                <div className="space-y-4">
                  {collaborationRequests.map(request => (
                    <CollaborationRequestCard
                      key={request.id}
                      request={request}
                      onStatusUpdate={handleRequestStatusUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No collaboration requests yet</p>
                  <p className="text-sm text-gray-500 mt-1">When investors are interested in your startup, their requests will appear here</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="space-y-4">
          {/* Confirmed meetings */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Meetings</h2>
              <Link to="/calendar" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View calendar
              </Link>
            </CardHeader>
            <CardBody className="space-y-3">
              {confirmedMeetings.length === 0 ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                    <Calendar size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No upcoming meetings</p>
                  <Link to="/calendar">
                    <Button variant="outline" size="sm" className="mt-2">
                      Open Calendar
                    </Button>
                  </Link>
                </div>
              ) : (
                confirmedMeetings.map(meeting => {
                  const isOwner = meeting.ownerId === user.id;
                  const other = findUserById(isOwner ? meeting.requesterId : meeting.ownerId);
                  return (
                    <Link to="/calendar" key={meeting.id}>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors cursor-pointer">
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
                })
              )}
            </CardBody>
          </Card>

          {/* Recommended investors */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </CardHeader>
            
            <CardBody className="space-y-4">
              {recommendedInvestors.map(investor => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  showActions={false}
                />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};