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
  increment,
  limit
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toData = (snap) => snap.exists() ? { id: snap.id, ...snap.data() } : null;
const toDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const now = () => serverTimestamp();

// Safe Firestore Timestamp → milliseconds (handles Timestamp, Date, or null)
const tsMs = (t) => {
  if (!t) return 0;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return 0;
};

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
  },

  /** Persiste o catálogo de modelos customizados do usuário. */
  async updateModelCatalog(uid, customModelIds) {
    await updateDoc(doc(db, 'users', uid), { customModelIds, updatedAt: now() });
  },

  /** Persiste o mapa de modelos por agente do usuário. */
  async updateAgentModels(uid, agentModels) {
    await updateDoc(doc(db, 'users', uid), { agentModels, updatedAt: now() });
  }
};

// ─── Campaign ─────────────────────────────────────────────────────────────────

export const Campaign = {
  async list(userId) {
    const q = query(
      collection(db, 'campaigns'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return toDocs(snap).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
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
    const q = query(
      collection(db, 'campaigns'),
      where('is_public', '==', true),
      where('is_completed', '==', true)
    );
    const snap = await getDocs(q);
    let results = toDocs(snap).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));

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
          c.title?.toLowerCase()?.includes(s) ||
          c.setting?.toLowerCase()?.includes(s)
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
      where('campaignId', '==', campaignId)
    );
    const snap = await getDocs(q);
    return toDocs(snap).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  },

  async upsert(campaignId, questionKey, data) {
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

  async update(id, data) {
    await updateDoc(doc(db, 'npcCreatures', id), { ...data, updatedAt: now() });
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
  // Retorna sistemas globais (sem userId) + sistemas customizados do usuário
  async list(userId) {
    const snap = await getDocs(collection(db, 'rpgSystems'));
    const all = toDocs(snap);
    return all.filter((s) => !s.userId || s.userId === userId);
  },

  async get(id) {
    const snap = await getDoc(doc(db, 'rpgSystems', id));
    return toData(snap);
  },

  async create(data) {
    const ref = await addDoc(collection(db, 'rpgSystems'), {
      ...data,
      is_custom: true,
      is_active: true,
      createdAt: now(),
      updatedAt: now()
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

// ─── SessionLog ───────────────────────────────────────────────────────────────

export const SessionLog = {
  async listByCampaign(campaignId) {
    const q = query(
      collection(db, 'sessionLogs'),
      where('campaignId', '==', campaignId)
    );
    const snap = await getDocs(q);
    return toDocs(snap).sort((a, b) => (a.session_number || 0) - (b.session_number || 0));
  },

  async create(data) {
    const ref = await addDoc(collection(db, 'sessionLogs'), {
      ...data,
      createdAt: now()
    });
    return { id: ref.id, ...data };
  },

  async deleteByCampaign(campaignId) {
    const logs = await this.listByCampaign(campaignId);
    await Promise.all(logs.map((l) => deleteDoc(doc(db, 'sessionLogs', l.id))));
  }
};

// ─── CampaignReward ───────────────────────────────────────────────────────────

export const CampaignReward = {
  async listByCampaign(campaignId) {
    const q = query(
      collection(db, 'campaignRewards'),
      where('campaignId', '==', campaignId)
    );
    const snap = await getDocs(q);
    return toDocs(snap).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
  },

  async create(data) {
    const ref = await addDoc(collection(db, 'campaignRewards'), {
      ...data,
      createdAt: now()
    });
    return { id: ref.id, ...data };
  },

  async delete(id) {
    await deleteDoc(doc(db, 'campaignRewards', id));
  },

  async deleteByCampaign(campaignId) {
    const rewards = await this.listByCampaign(campaignId);
    await Promise.all(rewards.map((r) => deleteDoc(doc(db, 'campaignRewards', r.id))));
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
      return false;
    } else {
      await setDoc(ref, { userId, campaignId, createdAt: now() });
      return true;
    }
  }
};

// ─── Admin Operations ─────────────────────────────────────────────────────────
// Funções exclusivas de administrador

export const AdminDB = {
  // Lista todos os usuários cadastrados
  async listAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return toDocs(snap);
  },

  // Lista todas as campanhas (todos os usuários)
  async listAllCampaigns() {
    const q = query(
      collection(db, 'campaigns'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return toDocs(snap);
  },

  // Altera o role de um usuário
  async updateUserRole(uid, role) {
    await updateDoc(doc(db, 'users', uid), { role, updatedAt: now() });
  },

  // Lista apenas sistemas globais (sem userId)
  async listGlobalSystems() {
    const snap = await getDocs(collection(db, 'rpgSystems'));
    const all = toDocs(snap);
    return all.filter((s) => !s.userId);
  },

  // Cria um sistema global (sem userId)
  async createGlobalSystem(data) {
    const ref = await addDoc(collection(db, 'rpgSystems'), {
      ...data,
      is_custom: false,
      is_active: true,
      createdAt: now(),
      updatedAt: now()
    });
    return { id: ref.id, ...data };
  },

  // Atualiza um sistema global
  async updateGlobalSystem(id, data) {
    await updateDoc(doc(db, 'rpgSystems', id), { ...data, updatedAt: now() });
  },

  // Remove um sistema global
  async deleteGlobalSystem(id) {
    await deleteDoc(doc(db, 'rpgSystems', id));
  },

  // Retorna estatísticas gerais do app
  async getStats() {
    const [usersSnap, campaignsSnap, systemsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'campaigns')),
      getDocs(collection(db, 'rpgSystems'))
    ]);
    const campaigns = toDocs(campaignsSnap);
    const systems = toDocs(systemsSnap);
    return {
      totalUsers: usersSnap.size,
      totalCampaigns: campaigns.length,
      publicCampaigns: campaigns.filter((c) => c.is_public).length,
      completedCampaigns: campaigns.filter((c) => c.is_completed).length,
      totalSystems: systems.length,
      globalSystems: systems.filter((s) => !s.userId).length
    };
  },

  // Deleta uma campanha e todos os dados relacionados (admin)
  async deleteCampaign(id) {
    await Campaign.delete(id);
    await CampaignStep.deleteByCampaign(id);
    await NpcCreature.deleteByCampaign(id);
    await SessionLog.deleteByCampaign(id);
    await CampaignReward.deleteByCampaign(id);
  }
};

// ─── AiAgent — Prompts Customizados dos Agentes de IA ────────────────────────
// Os admins podem sobrescrever systemPrompt, promptTemplate e temperature de cada agente.
// Os documentos têm IDs fixos (ex: 'question-what', 'campaign-generator').

export const AiAgent = {
  // Lista todos os agentes com customização salva
  async list() {
    const snap = await getDocs(collection(db, 'aiAgents'));
    return toDocs(snap);
  },

  // Busca um agente específico por ID
  async get(id) {
    const snap = await getDoc(doc(db, 'aiAgents', id));
    return toData(snap);
  },

  // Salva customização (upsert por ID fixo)
  async upsert(id, data) {
    await setDoc(doc(db, 'aiAgents', id), {
      ...data,
      updatedAt: now()
    }, { merge: true });
  },

  // Remove customização (restaura padrão)
  async delete(id) {
    await deleteDoc(doc(db, 'aiAgents', id));
  },

  // Carrega todos os overrides como um mapa { agentId: data }
  async loadOverridesMap() {
    const agents = await this.list();
    return Object.fromEntries(agents.map((a) => [a.id, a]));
  }
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
// Popula o banco com sistemas de RPG globais padrão

const GLOBAL_RPG_SYSTEMS = [
  {
    id: 'dnd5e',
    name: 'D&D 5ª Edição',
    description: 'Dungeons & Dragons 5ª Edição — o sistema de fantasia mais popular do mundo. Combina acessibilidade para iniciantes com profundidade para veteranos.',
    core_attributes: ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'],
    skill_system: 'Perícias baseadas em atributos com bônus de proficiência. 18 perícias, testes com d20 + modificador vs Dificuldade (DC).',
    dice_mechanics: 'd20 + modificador de atributo + bônus de proficiência (quando aplicável) vs Classe de Dificuldade (DC) ou Classe de Armadura (CA).',
    combat_system: 'Combate baseado em turnos com ordem de iniciativa (d20 + Destreza). Ações, Ação Bônus e Reação por turno. Sistema de Pontos de Vida.'
  },
  {
    id: 'pathfinder2e',
    name: 'Pathfinder 2ª Edição',
    description: 'Sistema de fantasia com alta complexidade e customização de personagens. Excelente para grupos que apreciam profundidade mecânica e muitas opções de build.',
    core_attributes: ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'],
    skill_system: '16 perícias com classificação (Treinado, Especialista, Mestre, Lendário). Sistema de ações de 3 pontos por turno.',
    dice_mechanics: 'd20 + bônus de proficiência + modificador de atributo vs DC. Quatro graus de sucesso: Falha Crítica, Falha, Sucesso, Sucesso Crítico.',
    combat_system: 'Sistema de 3 ações por turno (Mover, Atacar, Lançar Magia, etc.). Sem ação bônus — tudo custa ações. Muito tático e estratégico.'
  },
  {
    id: 'callofcthulhu7',
    name: 'Call of Cthulhu 7ª Edição',
    description: 'RPG de horror cósmico baseado nas obras de H.P. Lovecraft. Jogadores são investigadores comuns enfrentando horrores incompreensíveis. Mortalidade alta, foco em investigação e narrativa.',
    core_attributes: ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Tamanho', 'Aparência', 'Poder', 'Educação', 'Sorte'],
    skill_system: 'Perícias em percentual (0-100%). Testes com 1d100 abaixo do valor da perícia. Push the Roll: tente de novo com consequências graves.',
    dice_mechanics: 'd100 (dois d10) abaixo do valor de atributo ou perícia. Sucesso em Dificuldade: metade do valor. Sucesso Extremo: um quinto do valor.',
    combat_system: 'Combate simples e letal. Pontos de Vida baixos. Sanidade é recurso crucial — investigadores perdem sanidade ao testemunhar o sobrenatural.'
  },
  {
    id: 'vtm5e',
    name: 'Vampire: The Masquerade 5ª Edição',
    description: 'RPG de horror pessoal e político ambientado numa sociedade secreta de vampiros. Jogadores são vampiros tentando manter a humanidade enquanto navigam a Camarilla e Anarquistas.',
    core_attributes: ['Força', 'Destreza', 'Vigor', 'Carisma', 'Manipulação', 'Compostura', 'Inteligência', 'Raciocínio', 'Resolução'],
    skill_system: 'Habilidades em dots (0-5) divididas em Físicas, Sociais e Mentais. Pools de dados formados por Atributo + Habilidade.',
    dice_mechanics: 'Pools de d10. Sucessos com 6+. Sucessos críticos (10+) contam em pares. Compulsão da Fome adiciona dados de Fome que podem causar Bestialidade.',
    combat_system: 'Combate narrativo com pools de Atributo + Habilidade. Fome afeta combate. Disciplinas vampíricas (Potência, Celeridade, Ofuscação, etc.) são poderosas.'
  },
  {
    id: 'savageworlds',
    name: 'Savage Worlds Adventure Edition',
    description: 'Sistema genérico "Fast, Furious & Fun". Roda qualquer gênero (fantasia, sci-fi, western, horror). Combate cinematográfico e rápido, fácil de narrar.',
    core_attributes: ['Agilidade', 'Astúcia', 'Espírito', 'Força', 'Vigor'],
    skill_system: 'Perícias com dados que sobem de d4 a d12+. Qualquer personagem rola dado da perícia + d6 Curinga, usa o melhor. Extras rolam só o dado da perícia.',
    dice_mechanics: 'Dados escalonados (d4, d6, d8, d10, d12). Target Number padrão: 4. Raises (cada 4 acima do alvo) dão bônus. Wild Cards rolam dado extra (d6).',
    combat_system: 'Combate rápido e cinematográfico. Chacotas, Atrapalhos e manobras. Ferimentos acumulam penalidades. Extras morrem facilmente; Wild Cards são resilientes.'
  },
  {
    id: 'gurps4e',
    name: 'GURPS 4ª Edição',
    description: 'Generic Universal RolePlaying System — o sistema genérico mais completo e simulacionista. Permite criar qualquer personagem em qualquer cenário com granularidade total.',
    core_attributes: ['ST (Força)', 'DX (Destreza)', 'IQ (Inteligência)', 'HT (Saúde)'],
    skill_system: 'Centenas de perícias baseadas em atributos (IQ, DX, etc.). Níveis de perícia com dificuldades (Fácil, Médio, Difícil, Muito Difícil). Pontos de personagem para comprar tudo.',
    dice_mechanics: '3d6 igual ou abaixo do atributo/perícia. Sucesso crítico: ≤4 ou ≤ nível-10. Falha crítica: ≥17 ou ≥18. Margem de sucesso/falha importa.',
    combat_system: 'Combate detalhado e realista com localização de acertos. Manobras específicas (All-Out Attack, Deceptive Attack, etc.). Alto potencial de letalidade.'
  },
  {
    id: 'ordem-paranormal',
    name: 'Ordem Paranormal RPG',
    description: 'Sistema brasileiro criado por Rafael Lange (Cellbit). Investigadores da Ordem Paranormal enfrentam o paranormal e o Outro Lado. Mistura horror cósmico com ação contemporânea.',
    core_attributes: ['Agilidade', 'Força', 'Intelecto', 'Presença', 'Vigor'],
    skill_system: 'Perícias com bônus somados ao atributo base. Kits de personagem definem especializações. Sistema de Pontos de Esforço para habilidades especiais.',
    dice_mechanics: '2d20 abaixo do valor de atributo + perícia. Sucesso: ambos abaixo. Falha: ambos acima. Sucesso Parcial: apenas um abaixo. Críticos com resultados iguais.',
    combat_system: 'Turnos com Ações, Reações e Ações de Bônus. Pontos de Vida e Sanidade separados. Exposição ao paranormal gera traumas. Rituais do Outro Lado são poderosos e perigosos.'
  },
  {
    id: 'tormenta20',
    name: 'Tormenta20',
    description: 'Sistema brasileiro baseado no universo Tormenta. Fusão de alta fantasia épica com mecânicas modernas d20. O cenário tem deuses, raças únicas e a ameaça da Tormenta corrompendo o mundo.',
    core_attributes: ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'],
    skill_system: 'Perícias com graus de treinamento (Treinado, Veterano, Expert). Testes d20 + modificador vs Dificuldade. Usos criativos de perícias encorajados.',
    dice_mechanics: 'd20 + modificador de atributo + grau de treinamento vs Dificuldade. Crítico em 20 natural. Falha crítica em 1 natural com consequências dramáticas.',
    combat_system: 'Combate por turnos, iniciativa por Destreza. Sistema de Mana para magias. Divindades e poderes divinos. Tormenta pode corromper personagens expostos a ela.'
  },
  {
    id: 'cyberpunk-red',
    name: 'Cyberpunk Red',
    description: 'RPG de ficção científica distópica de Mike Pondsmith. Megacorporações dominam o mundo, netrunners invadem sistemas, rippers instalam cyberware. Ambientado em 2045, predecessor do universo Cyberpunk 2077.',
    core_attributes: ['Inteligência', 'Reflexos', 'Destreza', 'Tecnologia', 'Frieza', 'Atração', 'Sorte', 'Movimento', 'Físico', 'Empatia'],
    skill_system: 'Perícias compradas com pontos, somadas ao atributo. Roles (Netrunner, Rockerboy, Solo, Nomad, etc.) dão habilidades especiais exclusivas.',
    dice_mechanics: '1d10 + atributo + perícia vs Dificuldade. Criticals: 10 explode, role de novo e some. Fumbles: 1 sempre falha e tem consequências.',
    combat_system: 'Combate tático e letal com zonas de cobertura. Ferimentos sérios causam penalidades. Cyberware dá vantagens mas custa Empatia (Humanidade). Netrunners operam no Netspace.'
  },
  {
    id: 'fate-core',
    name: 'Fate Core',
    description: 'Sistema narrativo com mecânicas simples e muita flexibilidade criativa. Personagens definidos por Aspectos (frases descritivas) em vez de stats. Ideal para histórias colaborativas e gêneros variados.',
    core_attributes: ['Físico', 'Vontade'],
    skill_system: 'Pirâmide de perícias (1 no nível 4, 2 no 3, 3 no 2, 4 no 1). Perícias genéricas e adaptáveis. Aspectos criam modificadores narrativos (Invocar = +2, Forçar = complicação).',
    dice_mechanics: '4 Fate Dice (dF): cada dado resulta em +1, 0 ou -1. Total de -4 a +4. Invoca Aspectos para +2 ou rerole. Pontos de Destino para invocar Aspectos.',
    combat_system: 'Conflitos com troca de ataques e defesas. Estresse absorve dano. Consequências (Leve, Moderada, Grave, Extrema) narram ferimentos. Retirada estratégica sempre disponível.'
  },
  {
    id: 'shadowrun6e',
    name: 'Shadowrun 6ª Edição',
    description: 'Fusão de ciberpunk e alta fantasia. Em 2080, magia voltou ao mundo e raças fantásticas existem. Shadowrunners fazem serviços sujos para megacorporações em troca de nuyen. Hacking, magia e tiros.',
    core_attributes: ['Agilidade', 'Corpo', 'Reação', 'Força', 'Vontade', 'Lógica', 'Intuição', 'Carisma', 'Essência', 'Magia/Resonância'],
    skill_system: 'Pools de dados (atributo + perícia). Perícias especializadas dão +2. Edge (vantagem situacional) permite rerolls e efeitos especiais.',
    dice_mechanics: 'Pool de d6, conta acertos (5 ou 6). Glitch: maioria dos dados = 1. Critical Glitch: maioria = 1 e nenhum acerto. Edge points para rerolls e outros efeitos.',
    combat_system: 'Combate moderno com armas, magia e ciberware. Iniciativa com dados. Armadura reduz dano. Magos e Adeptos tem acesso a poderes sobrenaturais. Deckers hackead em RV.'
  },
  {
    id: 'delta-green',
    name: 'Delta Green',
    description: 'Horror cósmico contemporâneo. Agentes de uma organização secreta do governo americano investigam ameaças do Mythos de Lovecraft em cenário moderno. Moral ambígua, saúde mental frágil.',
    core_attributes: ['Força', 'Constituição', 'Destreza', 'Inteligência', 'Poder', 'Carisma'],
    skill_system: 'Baseado no sistema BRP/RuneQuest com perícias em percentual. Skills investigativas fundamentais: Medicina, Forensics, HUMINT, SIGINT, Persuade.',
    dice_mechanics: 'd100 abaixo do valor de perícia. Bonus dice (melhor de 2d10 para dezena): vantagem. Penalty dice: desvantagem. Lethality rating para armas de fogo.',
    combat_system: 'Extremamente letal com Lethality rating (tiro de rifle = 15% de morte instantânea). Ferimentos sérios incapacitam. Sanidade deteriora com cada exposição ao Mythos.'
  }
];

export const SeedData = {
  // Popula sistemas de RPG globais — idempotente (não duplica se já existir)
  async seedRpgSystems(onProgress) {
    const results = { added: [], skipped: [] };

    for (const system of GLOBAL_RPG_SYSTEMS) {
      const { id, ...data } = system;
      const ref = doc(db, 'rpgSystems', id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          ...data,
          is_custom: false,
          is_active: true,
          createdAt: now(),
          updatedAt: now()
        });
        results.added.push(data.name);
      } else {
        results.skipped.push(data.name);
      }

      if (onProgress) onProgress(results);
    }

    return results;
  },

  // Atualiza um sistema global existente com dados mais completos (força atualização)
  async forceUpdateRpgSystems(onProgress) {
    const results = { updated: [] };

    for (const system of GLOBAL_RPG_SYSTEMS) {
      const { id, ...data } = system;
      await setDoc(doc(db, 'rpgSystems', id), {
        ...data,
        is_custom: false,
        is_active: true,
        updatedAt: now()
      }, { merge: true });
      results.updated.push(data.name);
      if (onProgress) onProgress(results);
    }

    return results;
  }
};

// ─── CampaignStorage ────────────────────────────────────────────────────────
export const CampaignStorage = {
  async uploadMapImage(campaignId, mapId, file, onProgress) {
    const path = `campaigns/${campaignId}/maps/${mapId}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    return new Promise((resolve, reject) => {
      task.on('state_changed',
        (snapshot) => {
          if (onProgress) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(pct);
          }
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  }
};
