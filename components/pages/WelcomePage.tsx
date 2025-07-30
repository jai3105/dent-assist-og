

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

const animationStyles = `
  @keyframes background-pan {
    0% { background-position: 0% center; }
    50% { background-position: 100% center; }
    100% { background-position: 0% center; }
  }

  .animated-gradient-background {
    background: linear-gradient(60deg, var(--background-dark), #00331a, var(--surface-dark), #001a0d);
    background-size: 400% 400%;
    animation: background-pan 25s ease infinite;
    position: relative;
    overflow: hidden;
  }
  
  .title-word {
    display: inline-block;
    opacity: 0;
    transform: translateY(40px);
    animation: slideInUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  }

  @keyframes pulse-glow {
    0%, 100% { 
        transform: scale(1); 
        box-shadow: 0 0 10px var(--brand-primary), 0 0 20px var(--brand-primary);
    }
    50% { 
        transform: scale(1.05); 
        box-shadow: 0 0 25px var(--brand-primary), 0 0 50px var(--brand-secondary);
    }
  }
`;

const ParticleConstellation = () => (
    <svg width="100%" height="100%" className="absolute inset-0 z-0" style={{ opacity: 0.15 }}>
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: 'var(--brand-primary)', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: 'var(--brand-primary)', stopOpacity: 0 }} />
        </radialGradient>
        <style>
          {`
            @keyframes move {
              0% { transform: translate(0, 0); }
              25% { transform: translate(10px, 20px); }
              50% { transform: translate(-10px, -15px); }
              75% { transform: translate(15px, -10px); }
              100% { transform: translate(0, 0); }
            }
            .particle {
              animation: move 20s ease-in-out infinite;
            }
          `}
        </style>
      </defs>
      <g>
        {[...Array(25)].map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const r = Math.random() * 2 + 1;
          const delay = Math.random() * -20;
          return <circle key={i} className="particle" cx={`${x}%`} cy={`${y}%`} r={r} fill="url(#grad1)" style={{ animationDelay: `${delay}s`, animationDuration: `${20 + Math.random() * 20}s` }} />;
        })}
      </g>
    </svg>
);


export const WelcomePage: React.FC = () => {
    const title = "Welcome to DentAssist";

    return (
        <>
            <style>{animationStyles}</style>
            <div className="flex flex-col items-center justify-center min-h-screen animated-gradient-background text-white p-4">
                <ParticleConstellation />
                <div className="text-center z-10 relative">
                     <svg width="80" height="80" viewBox="0 0 24 24" className="mx-auto text-brand-primary mb-4 title-word" style={{ animationDelay: '0s' }}>
                        <path fill="currentColor" d="M17 2H7c-1.1 0-2 .9-2 2v5c0 1.66 1.34 3 3 3h1.34c.48 0 .93.2 1.25.53A3.991 3.991 0 0 0 12 14a3.991 3.991 0 0 0 1.41-1.47c.32-.33.77-.53 1.25-.53H16c1.66 0 3-1.34 3-3V4c0-1.1-.9-2-2-2zm-3 15.5c-1.18 1.18-3.03 1.18-4.2 0l-.8-.8c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l.8.8c1.95 1.95 5.12 1.95 7.07 0l.8-.8c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-.8.8z"/>
                    </svg>
                    <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter">
                        {title.split(" ").map((word, wordIndex) => (
                            <span key={wordIndex} className="title-word" style={{ animationDelay: `${wordIndex * 0.15 + 0.1}s` }}>
                                {word}&nbsp;
                            </span>
                        ))}
                    </h1>
                    <p className="text-xl md:text-2xl text-text-secondary-dark mt-4 max-w-2xl mx-auto title-word" style={{ animationDelay: '0.6s' }}>
                        The All-in-One Dental Super-App, Powered by Generative AI.
                    </p>
                </div>

                <div className="mt-20 z-10 relative title-word" style={{ animationDelay: '0.8s' }}>
                    <ReactRouterDOM.Link
                        to="/select-role"
                        className="bg-brand-primary text-background-dark font-bold py-4 px-12 rounded-full text-lg shadow-2xl transition-all duration-300 transform hover:scale-110"
                        style={{ animation: 'pulse-glow 4s infinite 1.5s' }}
                    >
                        Get Started
                    </ReactRouterDOM.Link>
                </div>

                <div className="absolute bottom-8 z-10 title-word" style={{ animationDelay: '1s' }}>
                    <ReactRouterDOM.Link
                        to="/admin"
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        Administrative Login
                    </ReactRouterDOM.Link>
                </div>
            </div>
        </>
    );
};