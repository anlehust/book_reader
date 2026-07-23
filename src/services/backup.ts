import type { BackupData } from '../db/types'; import { repositories } from '../db/repositories';
export async function downloadBackup(){const data=await repositories.backup.export();const blob=new Blob([JSON.stringify(data)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`readflow-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)}
export async function restoreBackup(file:File){const data=JSON.parse(await file.text()) as BackupData;await repositories.backup.import(data)}
