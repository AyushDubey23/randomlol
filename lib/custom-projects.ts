import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

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

export interface ProjectIndexItem {
  id: string;
  role: string;
  roleTitle: string;
  title: string;
  category: string;
  videoType: "youtube" | "drive";
  videoUrl: string;
  imagePreview?: string;
  isDraft: boolean;
  createdAt: number;
  updatedAt: number;
}

const INDEX_DOC_ID = "portfolio_projects_index";
const LEGACY_DOC_ID = "portfolio_custom_projects";

/**
 * Fetch all custom projects from Firestore.
 * Reads dedicated documents per project to avoid Firestore's 1MB single-document limit.
 */
export async function getCustomProjects(): Promise<CustomProject[]> {
  try {
    // 1. Try reading the project index
    const indexRef = doc(db, "analytics_daily", INDEX_DOC_ID);
    const indexSnap = await getDoc(indexRef);

    if (indexSnap.exists() && Array.isArray(indexSnap.data()?.list) && indexSnap.data().list.length > 0) {
      const indexList: ProjectIndexItem[] = indexSnap.data().list;

      // Fetch each project document in parallel
      const projectPromises = indexList.map(async (item) => {
        try {
          const projRef = doc(db, "analytics_daily", `proj_${item.id}`);
          const projSnap = await getDoc(projRef);
          if (projSnap.exists()) {
            return projSnap.data() as CustomProject;
          }
        } catch (fetchErr) {
          console.warn(`Could not fetch details for project ${item.id}:`, fetchErr);
        }
        // Fallback to index metadata if single doc fetch fails
        return {
          id: item.id,
          role: item.role,
          roleTitle: item.roleTitle,
          title: item.title,
          category: item.category,
          videoType: item.videoType,
          videoUrl: item.videoUrl,
          description: "",
          image: item.imagePreview || "",
          screenshots: [],
          isDraft: item.isDraft,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        } as CustomProject;
      });

      const results = await Promise.all(projectPromises);
      const valid = results.filter(Boolean);
      if (valid.length > 0) return valid;
    }

    // 2. Fallback to legacy single document if index is empty or not yet created
    const legacyRef = doc(db, "analytics_daily", LEGACY_DOC_ID);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && Array.isArray(legacySnap.data()?.projects)) {
      return legacySnap.data().projects as CustomProject[];
    }
  } catch (err) {
    console.error("Error fetching custom projects:", err);
  }
  return [];
}

/**
 * Save an individual project to Firestore.
 * Saves its full payload in a dedicated document (proj_{id}) and updates the global index.
 */
export async function saveSingleProject(project: CustomProject): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Save full project document in analytics_daily/proj_{id}
    const projRef = doc(db, "analytics_daily", `proj_${project.id}`);
    await setDoc(projRef, {
      ...project,
      updatedAt: Date.now(),
    });

    // 2. Read and update the index document
    const indexRef = doc(db, "analytics_daily", INDEX_DOC_ID);
    let indexList: ProjectIndexItem[] = [];

    try {
      const indexSnap = await getDoc(indexRef);
      if (indexSnap.exists() && Array.isArray(indexSnap.data()?.list)) {
        indexList = indexSnap.data().list;
      }
    } catch {
      // index will be initialized
    }

    const indexEntry: ProjectIndexItem = {
      id: project.id,
      role: project.role,
      roleTitle: project.roleTitle,
      title: project.title,
      category: project.category,
      videoType: project.videoType,
      videoUrl: project.videoUrl,
      imagePreview: project.image || "",
      isDraft: project.isDraft,
      createdAt: project.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    const existingIdx = indexList.findIndex((item) => item.id === project.id);
    if (existingIdx >= 0) {
      indexList[existingIdx] = indexEntry;
    } else {
      indexList.unshift(indexEntry);
    }

    await setDoc(indexRef, {
      list: indexList,
      lastUpdated: new Date().toISOString(),
    });

    // 3. Sync to legacy document as best-effort backup (ignoring size errors if too big)
    try {
      const legacyRef = doc(db, "analytics_daily", LEGACY_DOC_ID);
      const legacySnap = await getDoc(legacyRef);
      let legacyList: CustomProject[] = [];
      if (legacySnap.exists() && Array.isArray(legacySnap.data()?.projects)) {
        legacyList = legacySnap.data().projects;
      }
      const legIdx = legacyList.findIndex((p) => p.id === project.id);
      if (legIdx >= 0) {
        legacyList[legIdx] = project;
      } else {
        legacyList.unshift(project);
      }
      await setDoc(legacyRef, {
        projects: legacyList,
        lastUpdated: new Date().toISOString(),
      });
    } catch (legErr) {
      // Best effort only; primary per-project storage is already saved
      console.warn("Legacy sync skipped or exceeded size limit:", legErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed saving project:", err);
    return { success: false, error: err?.message || "Firestore save error" };
  }
}

/**
 * Delete a custom project from Firestore.
 */
export async function deleteCustomProject(id: string): Promise<boolean> {
  try {
    // 1. Delete project document
    const projRef = doc(db, "analytics_daily", `proj_${id}`);
    await deleteDoc(projRef).catch(() => {});

    // 2. Remove from index
    const indexRef = doc(db, "analytics_daily", INDEX_DOC_ID);
    const indexSnap = await getDoc(indexRef);
    if (indexSnap.exists() && Array.isArray(indexSnap.data()?.list)) {
      const updatedList = indexSnap.data().list.filter((item: ProjectIndexItem) => item.id !== id);
      await setDoc(indexRef, {
        list: updatedList,
        lastUpdated: new Date().toISOString(),
      });
    }

    // 3. Remove from legacy document
    try {
      const legacyRef = doc(db, "analytics_daily", LEGACY_DOC_ID);
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists() && Array.isArray(legacySnap.data()?.projects)) {
        const updatedLegacy = legacySnap.data().projects.filter((p: any) => p.id !== id);
        await setDoc(legacyRef, {
          projects: updatedLegacy,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch {}

    return true;
  } catch (err) {
    console.error("Failed deleting project:", err);
    return false;
  }
}
