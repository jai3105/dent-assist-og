
import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { Calendar, Smile, FileText, Bell, Check, Sun, Moon } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

// --- TYPE DEFINITIONS (Specific to this component) ---
export interface BrushingLogEntry {
  date: string; // 'YYYY-MM-DD'
  morning: boolean;
  night: boolean;
}

export interface PatientReminder {
  id: string;
  title: string;
  time: string;
  type: 'appointment' | 'medication' | 'custom';
  completed: boolean;
}

export interface HealthReport {
  id: string;
  title: string;
  date: string;
  url: string; // link to a mock pdf
}


// --- MOCK DATA ---
const mockAppointments: Omit<Appointment, 'patientId' | 'patientName' | 'status'>[] = [
    { id: 1, doctor: 'Dr. Gupta', procedure: 'Routine Check-up', date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), time: '11:00' },
    { id: 2, doctor: 'Dr. Sharma', procedure: 'Follow-up', date: format(addDays(new Date(), 10), 'yyyy-MM-dd'), time: '14:30' },
];

const mockReports: HealthReport[] = [
    { id: 'rep-1', title: 'Dental X-Ray Report', date: '2024-07-15', url: '#' },
    { id: 'rep-2', title: 'Treatment Plan Summary', date: '2024-06-20', url: '#' },
    { id: 'rep-3', title: 'Annual Check-up Results', date: '2024-01-10', url: '#' },
];

const mockReminders: PatientReminder[] = [
    { id: 'rem-1', title: 'Take antibiotic', time: '09:00 AM', type: 'medication', completed: false },
    { id: 'rem-2', title: 'Appointment with Dr. Gupta', time: 'in 3 days', type: 'appointment', completed: false },
    { id: 'rem-3', title: 'Avoid hard foods', time: 'All day', type: 'custom', completed: false },
];

const BRUSHING_LOG_KEY = 'patientCompanion_brushingLog_v1';

// --- Sub-components ---
const DashboardCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
            <div className="text-brand-primary">{icon}</div>
            <h3 className="text-xl font-bold text-text-primary-dark">{title}</h3>
        </div>
        <div className="flex-grow">{children}</div>
    </div>
);

const BrushingLog: React.FC = () => {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [log, setLog] = useState<Record<string, { morning: boolean; night: boolean }>>(() => {
        try {
            const savedLog = localStorage.getItem(BRUSHING_LOG_KEY);
            return savedLog ? JSON.parse(savedLog) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem(BRUSHING_LOG_KEY, JSON.stringify(log));
    }, [log]);

    const week = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    });

    const toggleLog = (date: Date, period: 'morning' | 'night') => {
        const dateKey = format(date, 'yyyy-MM-dd');
        setLog(prev => ({
            ...prev,
            [dateKey]: {
                morning: prev[dateKey]?.morning || false,
                night: prev[dateKey]?.night || false,
                [period]: !prev[dateKey]?.[period]
            }
        }));
    };
    
    return (
        <div>
             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-semibold text-text-secondary-dark">{format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}</h4>
                 {/* Optional: Add buttons to navigate weeks */}
             </div>
             <div className="grid grid-cols-7 gap-2 text-center">
                 {week.map(day => (
                     <div key={day.toString()} className={`p-2 rounded-lg ${isSameDay(day, new Date()) ? 'bg-brand-primary/20' : 'bg-background-dark'}`}>
                         <p className="text-xs font-bold text-text-secondary-dark">{format(day, 'E')}</p>
                         <p className="font-bold text-lg text-text-primary-dark">{format(day, 'd')}</p>
                         <div className="mt-2 flex justify-center gap-1">
                             <button onClick={() => toggleLog(day, 'morning')} className={`p-1 rounded-full ${log[format(day, 'yyyy-MM-dd')]?.morning ? 'bg-brand-secondary text-amber-900' : 'bg-border-dark text-text-secondary-dark'}`}><Sun size={14}/></button>
                             <button onClick={() => toggleLog(day, 'night')} className={`p-1 rounded-full ${log[format(day, 'yyyy-MM-dd')]?.night ? 'bg-indigo-400 text-indigo-900' : 'bg-border-dark text-text-secondary-dark'}`}><Moon size={14}/></button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};


// --- Main Component ---

export const PatientCompanion: React.FC = () => {
    const { t } = useTranslation();
    const [reminders, setReminders] = useState(mockReminders);

    const toggleReminder = (id: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    };

    const nextAppointment = mockAppointments.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">Patient Companion</h1>
                <p className="text-text-secondary-dark mt-2">Your personal hub for managing your dental health journey.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <DashboardCard title="Upcoming Appointment" icon={<Calendar size={24} />}>
                        {nextAppointment ? (
                            <div className="bg-background-dark p-4 rounded-lg">
                                <p className="text-lg font-bold text-brand-primary">{nextAppointment.procedure}</p>
                                <p className="text-text-secondary-dark">with {nextAppointment.doctor}</p>
                                <p className="text-xl font-semibold text-text-primary-dark mt-2">{format(new Date(nextAppointment.date), 'EEEE, MMMM do')} at {nextAppointment.time}</p>
                            </div>
                        ) : <p className="text-text-secondary-dark">No upcoming appointments.</p>}
                    </DashboardCard>
                    <DashboardCard title="Health Reports" icon={<FileText size={24} />}>
                        <ul className="space-y-2">
                            {mockReports.map(report => (
                                <li key={report.id} className="flex justify-between items-center p-3 bg-background-dark rounded-lg">
                                    <div>
                                        <p className="font-semibold text-text-primary-dark">{report.title}</p>
                                        <p className="text-xs text-text-secondary-dark">{report.date}</p>
                                    </div>
                                    <a href={report.url} className="text-sm font-semibold text-brand-primary hover:underline">View</a>
                                </li>
                            ))}
                        </ul>
                    </DashboardCard>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                     <DashboardCard title="Brushing Log" icon={<Smile size={24} />}>
                        <BrushingLog />
                     </DashboardCard>
                     <DashboardCard title="Today's Reminders" icon={<Bell size={24} />}>
                         <div className="space-y-2">
                             {reminders.map(reminder => (
                                 <div key={reminder.id} onClick={() => toggleReminder(reminder.id)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${reminder.completed ? 'bg-green-500/10' : 'bg-background-dark'}`}>
                                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${reminder.completed ? 'bg-green-500 border-green-400' : 'border-border-dark'}`}>
                                         {reminder.completed && <Check size={16} className="text-white"/>}
                                     </div>
                                     <div className="flex-grow">
                                         <p className={`font-medium ${reminder.completed ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>{reminder.title}</p>
                                         <p className="text-xs text-text-secondary-dark">{reminder.time}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </DashboardCard>
                </div>
            </div>
        </div>
    );
};