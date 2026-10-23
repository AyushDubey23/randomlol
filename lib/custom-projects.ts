import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface CustomProject {
  id: string;
  role: string; // "director" | "writer" | "editor" | "gaffer" | "producer" | "sounddesigner" | "soundoperator" | "photographer"
  roleTitle: string; // "DIRECTOR", "WRITER", etc.
  title: string;
  category: string;
  videoType: "youtube" | "drive";
  videoUrl: string;
  description: string;
  image: string; // Cover photo / landscape photo (Base64 data URL or external URL)
  screenshots: string[]; // Array of screenshots (Base64 data URLs or paths)
  isDraft: boolean;
  createdAt: number;
  updatedAt: number;
}

const FIRESTORE_DOC_PATH = "portfolio_custom_projects";

/**
 * Fetch all custom projects from Firestore
 */
export async function getCustomProjects(): Promise<CustomProject[]> {
  try {
    const docRef = doc(db, "analytics_daily", FIRESTORE_DOC_PATH);
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.projects)) {
      return snap.data().projects as CustomProject[];
    }
  } catch (err) {
    console.error("Error fetching custom projects:", err);
  }
  return [];
}

/**
 * Save all custom projects to Firestore
 */
export async function saveCustomProjects(projects: CustomProject[]): Promise<boolean> {
  try {
    const docRef = doc(db, "analytics_daily", FIRESTORE_DOC_PATH);
    await setDoc(docRef, {
      projects,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Error saving custom projects:", err);
    return false;
  }
}
