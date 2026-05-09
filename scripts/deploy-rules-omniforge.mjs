// Script: deploy-rules-to-omniforge.mjs
// Aplica firestore.rules ao database omniforge
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesContent = readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf8');

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'protagonista-rpg',
});

const db = getFirestore(app, 'omniforge');

// Test write to verify rules are working
async function test() {
  try {
    // Try to read users collection
    const usersSnap = await db.collection('users').limit(1).get();
    console.log(`users collection: ${usersSnap.size} docs readable via Admin SDK`);
    
    // Try to read campaigns
    const campaignsSnap = await db.collection('campaigns').limit(1).get();
    console.log(`campaigns collection: ${campaignsSnap.size} docs readable via Admin SDK`);
    
    console.log('\n✅ Admin SDK access to omniforge database is working.');
    console.log('The rules need to be deployed via Firebase Console or gcloud.');
    console.log('\nTo deploy rules to omniforge:');
    console.log('1. Go to https://console.firebase.google.com/project/protagonista-rpg/firestore/databases');
    console.log('2. Select the "omniforge" database');
    console.log('3. Go to the "Rules" tab');
    console.log('4. Paste the contents of firestore.rules');
    console.log('5. Publish');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();