export interface VolumeData {
    time: string;
    patients: number;
}

export interface CategoryData {
    name: string;
    value: number;
    color: string;
}

export interface DestinationData {
    name: string;
    value: number;
    color: string;
}

export interface TriageActivity {
    id: string;
    time: string;
    patient: string;
    type: 'Emergency' | 'Urgent' | 'Non-Urgent';
}

export interface TriageKPIs {
    totalTriagedToday: number;
    totalTriagedChangePct: number;
    emergentCases: number;
    avgTriageTimeMins: number;
    avgTriageTimeChangeMins: number;
    currentlyWaiting: number;
}
