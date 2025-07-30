
import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ActionType, Appointment, ICONS, PREDEFINED_SHORTCUTS } from './data';
import { useAppContext, Modal } from './common';

const AppointmentForm: React.FC<{ onSuccess: () => void; selectedDate?: Date; initialData?: Appointment; }> = ({ onSuccess, selectedDate, initialData }) => {
    const { state, dispatch } = useAppContext();
    const [formData, setFormData] = useState({
        patientId: initialData?.patientId || '', doctor: initialData?.doctor || '', procedure: initialData?.procedure || '',
        date: initialData?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''), time: initialData?.time || '10:00',
    });
    const doctorShortcuts = [...new Set([...PREDEFINED_SHORTCUTS.doctors, ...state.shortcuts.flatMap(s => s.category === 'doctors' && typeof s.value === 'string' ? [s.value] : [])])];
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); const p = state.patients.find(p => p.id === formData.patientId); if (!p) { alert("Please select a patient."); return; }
        const appt: Appointment = { 
            id: initialData?.id || Date.now().toString(), 
            patientId: formData.patientId, 
            patientName: `${p.firstName} ${p.lastName}`, 
            ...formData,
            status: initialData?.status || 'Scheduled'
        };
        dispatch({ type: initialData ? ActionType.UPDATE_APPOINTMENT : ActionType.ADD_APPOINTMENT, payload: appt });
        onSuccess();
    };
    
    const inputClass = "w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const labelClass = "block text-sm font-medium text-text-secondary-dark mb-1";
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="patientId" className={labelClass}>Patient</label><select name="patientId" id="patientId" value={formData.patientId} onChange={handleChange} required className={inputClass}><option value="" disabled>Select a patient</option>{state.patients.map(p => (<option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>))}</select></div>
            <div><label htmlFor="procedure" className={labelClass}>Procedure</label><input type="text" name="procedure" value={formData.procedure} onChange={handleChange} required placeholder="e.g., Annual Check-up" className={inputClass} /></div>
            <div><label htmlFor="doctor" className={labelClass}>Doctor</label><input list="doctors" name="doctor" value={formData.doctor} onChange={handleChange} required className={inputClass} /><datalist id="doctors">{doctorShortcuts.map(d => <option key={d} value={d} />)}</datalist></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label htmlFor="date" className={labelClass}>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className={`${inputClass} bg-slate-700`} /></div>
                <div><label htmlFor="time" className={labelClass}>Time</label><input type="time" name="time" value={formData.time} onChange={handleChange} required className={inputClass} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onSuccess} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button type="submit" className="flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">Save Appointment</button></div>
        </form>
    );
};

const CalendarHeader: React.FC<{ currentMonth: Date; onPrevMonth: () => void; onNextMonth: () => void; }> = ({ currentMonth, onPrevMonth, onNextMonth }) => (
    <div className="flex items-center justify-between px-6 py-4"><h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
            <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-slate-700">{ICONS.left}</button>
            <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-slate-700">{ICONS.right}</button>
        </div>
    </div>
);

const CalendarGrid: React.FC<{ currentMonth: Date; selectedDate: Date; onDateClick: (date: Date) => void; appointmentsByDate: { [key: string]: number } }> = ({ currentMonth, onDateClick, appointmentsByDate, selectedDate }) => {
    const monthStart = startOfMonth(currentMonth), monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }), endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return (
        <div className="grid grid-cols-7 gap-px bg-border-dark border-t border-b border-border-dark">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} className="py-2 text-center text-xs font-semibold text-text-secondary-dark bg-background-dark">{d}</div>)}
            {days.map(day => {
                const count = appointmentsByDate[format(day, 'yyyy-MM-dd')] || 0;
                return (<div key={day.toString()} onClick={() => onDateClick(day)} className={`relative p-2 h-24 flex flex-col group transition-colors ${isSameMonth(day, monthStart) ? 'bg-surface-dark hover:bg-background-dark' : 'bg-background-dark text-text-secondary-dark'} ${isSameDay(day, selectedDate) && isSameMonth(day, monthStart) ? '!bg-brand-primary/20' : ''} cursor-pointer`}>
                    <time dateTime={format(day, 'yyyy-MM-dd')} className={`text-sm ${isToday(day) ? 'flex items-center justify-center h-6 w-6 rounded-full bg-brand-primary text-white font-bold' : ''} ${isSameDay(day, selectedDate) ? 'font-bold text-brand-primary':''}`}>{format(day, 'd')}</time>
                    {count > 0 && (<div className="absolute bottom-2 right-2 text-xs text-white bg-brand-primary rounded-full h-5 w-5 flex items-center justify-center font-semibold">{count}</div>)}
                </div>)
            })}
        </div>
    );
};

const DailyAppointmentList: React.FC<{ selectedDate: Date; onEdit: (appointment: Appointment) => void; }> = ({ selectedDate, onEdit }) => {
    const { state, dispatch } = useAppContext();
    const appointments = useMemo(() => state.appointments.filter(a => isSameDay(new Date(a.date), selectedDate)).sort((a,b) => a.time.localeCompare(b.time)), [state.appointments, selectedDate]);
    const handleDelete = (id: string) => { if (window.confirm("Delete this appointment?")) { dispatch({ type: ActionType.DELETE_APPOINTMENT, payload: { id }}); }};
    return (
        <div className="p-6"><h3 className="text-lg font-semibold mb-4">Appointments for {format(selectedDate, 'EEEE, MMMM do')}</h3>
            {appointments.length > 0 ? (<ul className="space-y-3">
                {appointments.map(app => (<li key={app.id} className="p-4 bg-background-dark rounded-lg shadow-sm flex items-start justify-between border-l-4 border-brand-primary"><div>
                    <p className="font-semibold text-brand-primary">{app.patientName}</p><p className="text-sm text-text-secondary-dark">{app.procedure}</p><p className="text-xs text-slate-500">with {app.doctor}</p>
                </div><div className="flex items-center gap-2">
                    <span className="font-mono text-base text-text-primary-dark bg-border-dark px-3 py-1 rounded-md">{app.time}</span>
                    <button onClick={() => onEdit(app)} className="text-text-secondary-dark hover:text-brand-primary p-1">{ICONS.edit}</button>
                    <button onClick={() => handleDelete(app.id)} className="text-text-secondary-dark hover:text-red-500 p-1">{ICONS.trash}</button>
                </div></li>))}
            </ul>) : (<div className="text-center text-text-secondary-dark py-8"><p>No appointments scheduled.</p></div>)}
        </div>
    );
}

export const AppointmentsView: React.FC = () => {
    const { state } = useAppContext();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);

    const appointmentsByDate = useMemo(() => state.appointments.reduce((acc, app) => {
        const key = format(new Date(app.date), 'yyyy-MM-dd');
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number }), [state.appointments]);

    const handleOpenModal = (appointment?: Appointment) => { setEditingAppointment(appointment); setIsModalOpen(true); };

    return (
        <div className="space-y-6 animate-fade-in text-text-primary-dark">
            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold">Appointments</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500">{ICONS.add} New Appointment</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface-dark rounded-lg shadow-sm border border-border-dark"><CalendarHeader currentMonth={currentMonth} onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))} onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))} /><CalendarGrid currentMonth={currentMonth} selectedDate={selectedDate} onDateClick={setSelectedDate} appointmentsByDate={appointmentsByDate} /></div>
                <div className="bg-surface-dark rounded-lg shadow-sm border border-border-dark"><DailyAppointmentList selectedDate={selectedDate} onEdit={handleOpenModal} /></div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAppointment(undefined); }} title={editingAppointment ? 'Edit Appointment' : `New Appointment on ${format(selectedDate, 'MMMM do')}`}><AppointmentForm onSuccess={() => { setIsModalOpen(false); setEditingAppointment(undefined); }} initialData={editingAppointment} selectedDate={selectedDate} /></Modal>
        </div>
    );
};
