import { Bot, Users, Newspaper, Briefcase, Calendar, Compass, Store, BrainCircuit, Feather, GraduationCap, Search, Settings, LayoutDashboard, ClipboardList, RefreshCw, FlaskConical, LineChart, BookOpen, Video, Award, UserRound, HeartPulse, Camera, ZoomIn, Ghost, Shield, LifeBuoy, Route } from 'lucide-react';

export const studentSidebarConfig = [
    {
      titleKey: "sidebar.primaryFeatures",
      items: [
        { path: '/student/dashboard', icon: LayoutDashboard, translationKey: 'header.title.dashboard' },
        { path: '/student/dentforge', icon: Bot, translationKey: 'sidebar.dentforge.label' },
        { path: '/student/dentomedia', icon: Users, translationKey: 'sidebar.dentomedia.label' },
        { path: '/student/dentafeed', icon: Newspaper, translationKey: 'sidebar.dentafeed.label' },
        { path: '/student/dentahunt', icon: Briefcase, translationKey: 'sidebar.dentahunt.label' },
        { path: '/student/dentaround', icon: Calendar, translationKey: 'sidebar.dentaround.label' },
        { path: '/student/dentradar', icon: Compass, translationKey: 'sidebar.dentradar.label' },
        { path: '/student/dentamart', icon: Store, translationKey: 'sidebar.dentamart.label' },
      ],
    },
    {
      titleKey: "sidebar.professionalTools",
      items: [
        { path: '/student/dentaversity', icon: BrainCircuit, translationKey: 'sidebar.dentaversity.label' },
        { path: '/student/dentascribe', icon: Feather, translationKey: 'sidebar.dentascribe.label' },
        { path: '/student/prep-hub', icon: GraduationCap, translationKey: 'sidebar.prepHub.label' },
        { path: '/student/search-engine', icon: Search, translationKey: 'sidebar.searchEngine.label' },
        { path: '/student/dentasim', icon: ClipboardList, translationKey: 'sidebar.dentasim.label' },
        { path: '/student/settings', icon: Settings, translationKey: 'sidebar.settings.label' },
      ],
    },
];

export const professionalSidebarConfig = [
    {
        titleKey: "sidebar.primaryFeatures",
        items: [
            { path: '/professional/dashboard', icon: LayoutDashboard, translationKey: 'header.title.dashboard' },
            { path: '/professional/dentforge', icon: Bot, translationKey: 'sidebar.dentforge.label' },
            { path: '/professional/dentomedia', icon: Users, translationKey: 'sidebar.dentomedia.label' },
            { path: '/professional/dentafeed', icon: Newspaper, translationKey: 'sidebar.dentafeed.label' },
            { path: '/professional/dentahunt', icon: Briefcase, translationKey: 'sidebar.dentahunt.label' },
            { path: '/professional/dentaround', icon: Calendar, translationKey: 'sidebar.dentaround.label' },
            { path: '/professional/dentradar', icon: Compass, translationKey: 'sidebar.dentradar.label' },
            { path: '/professional/dentamart', icon: Store, translationKey: 'sidebar.dentamart.label' },
        ]
    },
    {
        titleKey: "sidebar.professionalTools",
        items: [
            { path: '/professional/dentsync', icon: RefreshCw, translationKey: 'sidebar.dentsync.label' },
            { path: '/professional/dentalab-connect', icon: FlaskConical, translationKey: 'sidebar.dentalab.label' },
            { path: '/professional/dentstats', icon: LineChart, translationKey: 'sidebar.dentstats.label' },
            { path: '/professional/dental-diary', icon: BookOpen, translationKey: 'sidebar.clinicalDiary.label' },
            { path: '/professional/teledent-ai', icon: Video, translationKey: 'sidebar.teledent.label' },
            { path: '/professional/cde-ai', icon: Award, translationKey: 'sidebar.cdeai.label' },
            { path: '/professional/settings', icon: Settings, translationKey: 'sidebar.settings.label' },
        ]
    }
];

export const publicSidebarConfig = [
    {
        titleKey: "sidebar.publicPatient",
        items: [
            { path: '/public/dashboard', icon: LayoutDashboard, translationKey: 'header.title.dashboard' },
            { path: '/public/patient-companion', icon: UserRound, translationKey: 'sidebar.patientCompanion.label' },
            { path: '/public/dentajourney', icon: Route, translationKey: 'sidebar.dentajourney.label' },
            { path: '/public/symptom-checker', icon: HeartPulse, translationKey: 'sidebar.symptomChecker.label' },
            { path: '/public/ai-scanner', icon: Camera, translationKey: 'sidebar.aiScanner.label' },
            { path: '/public/oralscreen', icon: ZoomIn, translationKey: 'sidebar.oralScreen.label' },
            { path: '/public/procedure-pedia', icon: ClipboardList, translationKey: 'sidebar.procedurePedia.label' },
            { path: '/public/myth-busters', icon: Ghost, translationKey: 'sidebar.mythBusters.label' },
            { path: '/public/insurance-decoder', icon: Shield, translationKey: 'sidebar.insuranceDecoder.label' },
            { path: '/public/trauma-care', icon: LifeBuoy, translationKey: 'sidebar.traumaCare.label' },
            { path: '/public/settings', icon: Settings, translationKey: 'sidebar.settings.label' },
        ]
    }
];
