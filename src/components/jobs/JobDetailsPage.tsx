import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Briefcase, DollarSign, Clock, MapPin, 
  ArrowLeft, Calendar, User, Tag, ShieldCheck,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ApplyModal } from './ApplyModal';

export function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    const fetchJobData = async () => {
      if (!id) return;
      try {
        const jobRef = doc(db, 'jobs', id);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          const jobData = { id: jobSnap.id, ...jobSnap.data() } as any;
          setJob(jobData);
          
          // Fetch client info
          const clientRef = doc(db, 'users', jobData.client_id);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            setClient(clientSnap.data());
          }
        } else {
          navigate('/jobs');
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [id, navigate]);

  if (loading) return <div className="pt-32 container mx-auto px-6">Loading job details...</div>;
  if (!job) return null;

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <ApplyModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        job={job} 
      />

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass border-white/10 p-8 pt-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl -mr-32 -mt-32" />
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div>
                <h1 className="text-4xl font-display font-bold mb-4">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-white/40">
                  <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {job.category}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Remote</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">${job.budget}</p>
                <p className="text-sm text-white/40">{job.budget_type === 'hourly' ? 'Estimated / hr' : 'Fixed Price'}</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-12">
              <h3 className="text-xl font-bold mb-4 text-white">Project Description</h3>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills_required?.map((skill: string) => (
                  <Badge key={skill} className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Client Info & Action */}
        <div className="space-y-8">
          <Card className="glass border-white/10 p-8">
            <div className="space-y-6">
              <Button 
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full h-14 bg-primary hover:bg-primary/80 text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                Submit Proposal
                <Send className="ml-2 w-5 h-5" />
              </Button>
              
              <div className="pt-6 border-t border-white/5 space-y-6">
                <h3 className="font-bold text-lg">About the Client</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border border-white/10">
                    <AvatarImage src={client?.avatar_url} />
                    <AvatarFallback>{client?.full_name?.[0] || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold truncate max-w-[150px]">{client?.full_name || 'Anonymous Client'}</h4>
                    <p className="text-xs text-white/40 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-green-500" /> Payment Verified
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-xl font-bold">12</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Jobs Posted</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-xl font-bold">4.8</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Client Rating</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Location</span>
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Member since</span>
                    <span>{client?.created_at ? new Date(client.created_at).getFullYear() : '2024'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass border-white/10 p-6 bg-primary/5">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Similar Jobs
            </h4>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="group cursor-pointer">
                  <h5 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">Expert Web App Developer Needed</h5>
                  <p className="text-xs text-white/40">$2,500 • Fixed</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
