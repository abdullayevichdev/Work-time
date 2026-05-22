import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FuturisticEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function FuturisticEmptyState({ icon: Icon, title, description, action }: FuturisticEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative mb-8 group"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="relative w-32 h-32 rounded-full glass border border-white/10 flex items-center justify-center bg-indigo-900/10 overflow-hidden">
          {/* Animated rings */}
          <div className="absolute inset-0 border border-primary/20 rounded-full scale-[1.2] animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-0 border border-secondary/20 rounded-full scale-[1.5] animate-[spin_6s_linear_infinite_reverse]" />
          
          <Icon className="w-12 h-12 text-primary animate-pulse relative z-10" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center max-w-md"
      >
        <h3 className="text-2xl md:text-3xl font-display font-bold text-indigo-950 mb-3 text-sharp">
          {title}
        </h3>
        <p className="text-indigo-900/40 font-medium mb-8 leading-relaxed text-sharp">
          {description}
        </p>
        
        {action && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
