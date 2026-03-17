import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toData = (snap) => snap.exists() ? { id: snap.id, ...snap.data() } : null;
const toDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const now = () => serverTimestamp();

// ─── User Profile ─────────────────────────────────────────────────────────────

export const UserProfile = {
  async get(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return toData(snap);
  },

  async upsert(uid, data) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...data, updatedAt: now() });
    } else {
      await setDoc(ref, { ...data, createdAt: now(), updatedAt: now() });
    }
  },

  async updateAiConfig(uid, aiConfig) {
    await updateDoc(doc(db, 'users', uid), { aiConfig, updatedAt: now() });
  }
};

// ─── Campaign ─────────────────────────────────────────────────────────────────

export const Campaign = {
  async list(userId) {
    const q = query(
      collection(db, 'campaigns'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return toDocs(snap);
  },

  async get(id) {
    const snap = await getDoc(doc(db, 'campaigns', id));
    return toData(snap);
  },

  async create(data) {
    const ref = await addDoc(collection(db, 'campaigns'), {
      ...data,
      clone_count: 0,
      is_public: false,
      is_completed: false,
      current_step: 0,
      createdAt: now(),
      updatedAt: now()
    });
    return { id: ref.id, ...data };
  },

  async update(id, data) {
    await updateDoc(doc(db, 'campaigns', id), { ...data, updatedAt: now() });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'campaigns', id));
  },

  async listPublic(filters = {}) {
    let q = query(
      collection(db, 'campaigns'),
      where('is_public', '==', true),
      where('is_completed', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    let results = toDocs(snap);

    if (filters.system_rpg) {
      results = results.filter((c) => c.system_rpg === filters.system_rpg);
    }
    if (filters.setting) {
      results = results.filter((c) => c.setting === filters.setting);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.title?.toLowerCase().includes(s) ||
          c.setting?.toLowerCase().includes(s)
      );
    }
    return results;
  },

  async incrementCloneCount(id) {
    await updateDoc(doc(db, 'campaigns', id), { clone_count: increment(1) });
  }
};

// ─── CampaignStep ─────────────────────────────────────────────────────────────

export const CampaignStep = {
  async listByCampaign(campaignId) {
    const q = query(
      collection(db, 'campaignSteps'),
      where('campaignId', '==', campaignId),
      orderBy('order_index', 'asc')
    );
    const snap = await getDocs(q);
    return toDocs(snap);
  },

  async upsert(campaignId, questionKey, data) {
    // Use composite key to avoid duplicates
    const id = `${campaignId}_${questionKey}`;
    await setDoc(doc(db, 'campaignSteps', id), {
      ...data,
      campaignId,
      question_key: questionKey,
      updatedAt: now()
    }, { merge: true });
  },

  async deleteByCampaign(campaignId) {
    const steps = await this.listByCampaign(campaignId);
    await Promise.all(steps.map((s) => deleteDoc(doc(db, 'campaignSteps', s.id))));
  }
};

// ─── NpcCreature ─────────────────────────────────────────────────────────────

export const NpcCreature = {
  async listByCampaign(campaignId) {
    const q = query(
      collection(db, 'npcCreatures'),
      where('campaignId', '==', campaignId)
    );
    const snap = await getDocs(q);
    return toDocs(snap);
  },

  async create(data) {
    const ref = await addDoc(collection(db, 'npcCreatures'), {
      ...data,
      createdAt: now()
    });
    return { id: ref.id, ...data };
  },

  async delete(id) {
    await deleteDoc(doc(db, 'npcCreatures', id));
  },

  async deleteByCampaign(campaignId) {
    const npcs = await this.listByCampaign(campaignId);
    await Promise.all(npcs.map((n) => deleteDoc(doc(db, 'npcCreatures', n.id))));
  }
};

// ─── RpgSystem ────────────────────────────────────────────────────────────────

export const RpgSystem = {
  async list(userId) {
    const snap = await getDocs(collection(db, 'rpgSystems'));
    const all = toDocs(snap);
    // Return global defaults + user's custom systems
    return all.filter((s) => !s.userId || s.userId === userId);
  },

  async create(data) {
    const ref = await addDoc(collection(db, 'rpgSystems'), {
      ...data,
      is_custom: true,
      is_active: true,
      createdAt: now()
    });
    return { id: ref.id, ...data };
  },

  async update(id, data) {
    await updateDoc(doc(db, 'rpgSystems', id), { ...data, updatedAt: now() });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'rpgSystems', id));
  }
};

// ─── CampaignLike ─────────────────────────────────────────────────────────────

export const CampaignLike = {
  async listByUser(userId) {
    const q = query(
      collection(db, 'campaignLikes'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return toDocs(snap);
  },

  async toggle(userId, campaignId) {
    const id = `${userId}_${campaignId}`;
    const ref = doc(db, 'campaignLikes', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      return false; // unliked
    } else {
      await setDoc(ref, { userId, campaignId, createdAt: now() });
      return true; // liked
    }
  }
};
