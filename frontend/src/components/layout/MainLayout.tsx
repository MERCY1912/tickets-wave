import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { motion } from 'framer-motion';

export function MainLayout() {
  return (
    <>
      {/* Aurora Glows - On the very background layer, behind everything */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-background">
        {/* Top left - Indigo glow */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          animate={{
            x: [0, 150, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0.1) 40%, transparent 70%)',
            filter: 'blur(100px)',
            top: '-200px',
            left: '-200px',
          }}
        />
        {/* Top right - Purple glow */}
        <motion.div
          className="absolute w-[550px] h-[550px] rounded-full"
          animate={{
            x: [0, -120, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.32) 0%, rgba(168, 85, 247, 0.08) 40%, transparent 70%)',
            filter: 'blur(100px)',
            top: '-180px',
            right: '-180px',
          }}
        />
        {/* Bottom right - Blue glow */}
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full"
          animate={{
            x: [0, -150, 0],
            y: [0, 120, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(59, 130, 246, 0.06) 40%, transparent 70%)',
            filter: 'blur(100px)',
            bottom: '-250px',
            right: '-250px',
          }}
        />
        {/* Bottom left - Cyan glow */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          animate={{
            x: [0, 180, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.06) 40%, transparent 70%)',
            filter: 'blur(100px)',
            bottom: '-150px',
            left: '-150px',
          }}
        />
        {/* Center - Faint violet glow */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          animate={{
            x: [80, -80, 80],
            y: [-50, 50, -50],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.04) 60%, transparent 70%)',
            filter: 'blur(120px)',
            top: '30%',
            left: '35%',
          }}
        />
      </div>

      {/* Main App Container */}
      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <aside className="w-96 flex-shrink-0">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
