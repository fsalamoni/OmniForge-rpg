import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_SOURCE_DATABASE = '(default)';
const DEFAULT_TARGET_DATABASE = 'omniforge';
const COMMON_COLLECTIONS = ['siteContent', 'aiAgents'];
const RELATED_COLLECTIONS = ['campaignSteps', 'npcCreatures', 'sessionLogs', 'campaignRewards'];

const parseCsv = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const readOptions = () => {
  const options = {
    source: process.env.FIRESTORE_SOURCE_DATABASE_ID || DEFAULT_SOURCE_DATABASE,
    target: process.env.FIRESTORE_TARGET_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || DEFAULT_TARGET_DATABASE,
    project: process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
    write: false,
    overwrite: false,
    includeAllUsers: false,
    users: []
  };

  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--write') {
      options.write = true;
    } else if (arg === '--overwrite') {
      options.overwrite = true;
    } else if (arg === '--include-all-users') {
      options.includeAllUsers = true;
    } else if (arg === '--source' && next) {
      options.source = next;
      index += 1;
    } else if (arg.startsWith('--source=')) {
      options.source = arg.slice('--source='.length);
    } else if (arg === '--target' && next) {
      options.target = next;
      index += 1;
    } else if (arg.startsWith('--target=')) {
      options.target = arg.slice('--target='.length);
    } else if (arg === '--project' && next) {
      options.project = next;
      index += 1;
    } else if (arg.startsWith('--project=')) {
      options.project = arg.slice('--project='.length);
    } else if (arg === '--user' && next) {
      options.users.push(...parseCsv(next));
      index += 1;
    } else if (arg.startsWith('--user=')) {
      options.users.push(...parseCsv(arg.slice('--user='.length)));
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }

  options.users = [...new Set(options.users)];
  return options;
};

const printHelp = () => {
  console.log(`
Restaura dados do OmniForge para um Firestore database dedicado sem apagar nem alterar o banco de origem.

Uso:
  npm run restore:omniforge-db -- --project <firebase-project-id> [opções]

Opções:
  --source <id>             Database de origem. Padrão: ${DEFAULT_SOURCE_DATABASE}
  --target <id>             Database dedicado do OmniForge. Padrão: ${DEFAULT_TARGET_DATABASE}
  --user <uid[,uid2]>       Limita a restauração a campanhas desses usuários.
  --include-all-users       Copia todos os documentos de users. Sem isso, copia apenas usuários donos das campanhas copiadas.
  --write                   Executa a cópia. Sem isso, roda em modo dry-run.
  --overwrite               Sobrescreve documentos já existentes no destino. Por padrão, documentos existentes são preservados.

Coleções copiadas:
  users, campaigns, campaignSteps, npcCreatures, rpgSystems, sessionLogs, campaignRewards, campaignLikes, siteContent, aiAgents
`);
};

const databaseFor = (app, databaseId) =>
  databaseId === DEFAULT_SOURCE_DATABASE ? getFirestore(app) : getFirestore(app, databaseId);

const readAllDocs = async (database, collectionName) => {
  const snapshot = await database.collection(collectionName).get();
  return snapshot.docs;
};

const readDocsById = async (database, collectionName, ids) => {
  const docs = [];
  for (const id of ids) {
    const snapshot = await database.collection(collectionName).doc(id).get();
    if (snapshot.exists) {
      docs.push(snapshot);
    }
  }
  return docs;
};

const copyDocs = async ({ sourceDocs, targetDb, collectionName, options }) => {
  const summary = { collectionName, copied: 0, skippedExisting: 0, dryRun: 0 };

  for (const sourceDoc of sourceDocs) {
    const targetRef = targetDb.collection(collectionName).doc(sourceDoc.id);

    if (!options.overwrite) {
      const targetDoc = await targetRef.get();
      if (targetDoc.exists) {
        summary.skippedExisting += 1;
        continue;
      }
    }

    if (!options.write) {
      summary.dryRun += 1;
      continue;
    }

    await targetRef.set(sourceDoc.data());
    summary.copied += 1;
  }

  return summary;
};

const logSummary = (summary) => {
  const action = summary.dryRun > 0 ? `dry-run=${summary.dryRun}` : `copiados=${summary.copied}`;
  const skipped = summary.skippedExisting > 0 ? `, preservados=${summary.skippedExisting}` : '';
  console.log(`${summary.collectionName}: ${action}${skipped}`);
};

const main = async () => {
  const options = readOptions();
  if (options.help) {
    printHelp();
    return;
  }

  if (options.source === options.target) {
    throw new Error('Origem e destino precisam ser databases diferentes.');
  }

  const app = initializeApp({
    credential: applicationDefault(),
    projectId: options.project
  });

  const sourceDb = databaseFor(app, options.source);
  const targetDb = databaseFor(app, options.target);
  const selectedUserIds = new Set(options.users);
  const copiedCampaignIds = new Set();
  const copiedUserIds = new Set(options.users);
  const summaries = [];

  console.log(`Projeto: ${options.project || '(detectado pelas credenciais)'}`);
  console.log(`Origem: ${options.source}`);
  console.log(`Destino: ${options.target}`);
  console.log(options.write ? 'Modo: escrita habilitada' : 'Modo: dry-run; adicione --write para copiar');
  console.log(options.overwrite ? 'Destino: sobrescreve documentos existentes' : 'Destino: preserva documentos existentes');

  const allCampaigns = await readAllDocs(sourceDb, 'campaigns');
  const campaigns = selectedUserIds.size === 0
    ? allCampaigns
    : allCampaigns.filter((doc) => selectedUserIds.has(doc.data().userId));

  for (const campaignDoc of campaigns) {
    copiedCampaignIds.add(campaignDoc.id);
    if (campaignDoc.data().userId) {
      copiedUserIds.add(campaignDoc.data().userId);
    }
  }

  const userDocs = options.includeAllUsers
    ? await readAllDocs(sourceDb, 'users')
    : await readDocsById(sourceDb, 'users', copiedUserIds);
  summaries.push(await copyDocs({ sourceDocs: userDocs, targetDb, collectionName: 'users', options }));
  summaries.push(await copyDocs({ sourceDocs: campaigns, targetDb, collectionName: 'campaigns', options }));

  const allSystems = await readAllDocs(sourceDb, 'rpgSystems');
  const systems = allSystems.filter((doc) => {
    const userId = doc.data().userId;
    return !userId || options.includeAllUsers || copiedUserIds.has(userId);
  });
  summaries.push(await copyDocs({ sourceDocs: systems, targetDb, collectionName: 'rpgSystems', options }));

  for (const collectionName of RELATED_COLLECTIONS) {
    const docs = (await readAllDocs(sourceDb, collectionName))
      .filter((doc) => copiedCampaignIds.has(doc.data().campaignId));
    summaries.push(await copyDocs({ sourceDocs: docs, targetDb, collectionName, options }));
  }

  const likes = (await readAllDocs(sourceDb, 'campaignLikes'))
    .filter((doc) => copiedCampaignIds.has(doc.data().campaignId) || copiedUserIds.has(doc.data().userId));
  summaries.push(await copyDocs({ sourceDocs: likes, targetDb, collectionName: 'campaignLikes', options }));

  for (const collectionName of COMMON_COLLECTIONS) {
    const docs = await readAllDocs(sourceDb, collectionName);
    summaries.push(await copyDocs({ sourceDocs: docs, targetDb, collectionName, options }));
  }

  console.log('\nResumo:');
  summaries.forEach(logSummary);
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
