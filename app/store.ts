export let pendingProcessId: string | null = null;

export function setPendingId(id: string){
    pendingProcessId = id;
}


export function clearPendingId(){
    pendingProcessId = null;
}