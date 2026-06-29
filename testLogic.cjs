const folders = [
  { id: 'f98d61c0-2c78-410a-a6ef-f7b167a18103', name: '2023 March', parent_id: null, category: 'general' },
  { id: 'c278065a-5fcf-41b0-a915-7aec11b79a30', name: '2023 June', parent_id: null, category: 'general' },
  { id: '7dd560cf-9b09-440c-b83a-140163e7bd76', name: 'VERBAL - INT A', parent_id: 'c278065a-5fcf-41b0-a915-7aec11b79a30', category: null },
  { id: 'e533572f-b58f-4699-a5f7-ae7919f01397', name: 'Math - INT A', parent_id: 'c278065a-5fcf-41b0-a915-7aec11b79a30', category: null },
  { id: '2edceddb-97d7-4f50-9901-bc328b93c0be', name: '2023 May', parent_id: null, category: 'general' }
];

const modules = [
  { id: '46a6a392-3d02-4bde-a00b-716cd4a284ba', title: 'VERBAL - INT A - mod 1', folder_id: '7dd560cf-9b09-440c-b83a-140163e7bd76' },
  { id: '298774d3-ea11-4c7f-8da2-a953b3ffe709', title: 'VERBAL - INT A - mod 2', folder_id: '7dd560cf-9b09-440c-b83a-140163e7bd76' },
];

const activeCategory = 'general';
const selectedFolderId = '7dd560cf-9b09-440c-b83a-140163e7bd76'; // VERBAL - INT A

const categoryFolders = folders.filter(f => f.category === activeCategory || (!f.category && activeCategory === 'general'));
console.log('categoryFolders IDs:', categoryFolders.map(f => f.id));

const getFolderIdsRecursive = (folderId) => {
  const children = folders.filter(f => f.parent_id === folderId).map(f => f.id);
  let ids = [folderId, ...children];
  for (const child of children) {
    ids = [...ids, ...getFolderIdsRecursive(child)];
  }
  return Array.from(new Set(ids));
};

const targetFolderIds = getFolderIdsRecursive(selectedFolderId);
console.log('targetFolderIds:', targetFolderIds);

const displayModules = modules.filter(m => m.folder_id && targetFolderIds.includes(m.folder_id));
console.log('displayModules length:', displayModules.length);
console.log('displayModules:', displayModules);
