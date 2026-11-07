import * as T from '@/constants';

export function getFormattedDate(){
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function getFormattedTime(){
    const now = new Date();
    return now.toLocaleTimeString('en-US',{
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDuration(seconds:number){
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

export function getSubjectColor(subject: string){
    if (!subject){
        return T.COLORS.pastelPurp;
    }
    const index = subject.charCodeAt(0) % T.PASTEL_COLORS.length;
    return T.PASTEL_COLORS[index]
}