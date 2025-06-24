import { db } from './firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where, updateDoc } from 'firebase/firestore';

export interface AnalysisRecord {
  id?: string;         // Firestore doc id (filled when reading)
  userId: string;      // uid of Firebase Auth user
  name: string;        // user provided analysis name
  network: string;     // bitcoin | ethereum | solana
  nodeData: string;    // raw node data JSON/CSV/etc.
  createdAt?: Date;    // JS Date when retrieved
  metrics?: {
    gini?: number | null;
    nakamoto?: number | null;
    connectivityLoss?: string | number | null;
  };
}

// Save analysis for a given user, returns the new document id
export async function saveAnalysis(record: Omit<AnalysisRecord, 'id' | 'createdAt'>): Promise<string> {
  // Remove undefined values (Firestore does not allow them)
  const cleanRecord: any = { ...record };

  // If metrics is undefined, omit it; otherwise omit undefined fields within metrics
  if (cleanRecord.metrics === undefined) {
    delete cleanRecord.metrics;
  } else {
    const metricsObj: any = {};
    Object.entries(cleanRecord.metrics).forEach(([k, v]) => {
      if (v !== undefined) metricsObj[k] = v;
    });
    cleanRecord.metrics = metricsObj;
  }

  const docRef = await addDoc(collection(db, 'analyses'), {
    ...cleanRecord,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Fetch all analyses belonging to a user, ordered by newest first
export async function getUserAnalyses(userId: string): Promise<AnalysisRecord[]> {
  const q = query(collection(db, 'analyses'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as AnalysisRecord;
    return { ...data, id: d.id, createdAt: (data as any).createdAt?.toDate?.() };
  });
}

// Fetch single analysis by id
export async function getAnalysisById(id: string): Promise<AnalysisRecord | null> {
  const docRef = doc(db, 'analyses', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data() as AnalysisRecord;
  return { ...data, id: snap.id, createdAt: (data as any).createdAt?.toDate?.() };
}

// Update existing analysis (partial update)
export async function updateAnalysis(id: string, data: Partial<AnalysisRecord>): Promise<void> {
  // Remove undefined values recursively similar to saveAnalysis sanitization
  const clean: any = {};
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });

  if (clean.metrics) {
    const m: any = {};
    Object.entries(clean.metrics as any).forEach(([k, v]) => {
      if (v !== undefined) m[k] = v;
    });
    clean.metrics = m;
  }

  await updateDoc(doc(db, 'analyses', id), clean);
} 