const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 856,
    height: 1033,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#0f1117',
    title: 'CopyGuard',
    icon: path.join(__dirname, '..', 'assets', 'copyguard.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function ensureInsideRoot(rootPath, candidatePath) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedCandidate = path.resolve(candidatePath);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function backupFolderName() {
  const date = new Date().toISOString().slice(0, 10);
  return `FILE_BELUM_TERCOPY_${date}`;
}

async function walkFolder(rootPath) {
  const results = [];
  const stack = [rootPath];

  while (stack.length) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;
      const stat = await fs.stat(absolutePath);
      const relativePath = path.relative(rootPath, absolutePath);
      const normalizedRelativePath = relativePath.split(path.sep).join('/');

      results.push({
        name: entry.name,
        relativePath: normalizedRelativePath,
        size: stat.size
      });
    }
  }

  return results;
}

ipcMain.handle('folder:pick', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths[0]) return null;

  const folderPath = result.filePaths[0];
  const files = await walkFolder(folderPath);

  return {
    folderPath,
    rootName: path.basename(folderPath),
    files
  };
});

ipcMain.handle('missing:collect', async (_event, payload) => {
  const { sourceRoot, destinationRoot, files } = payload || {};
  if (!sourceRoot || !destinationRoot || !Array.isArray(files) || files.length === 0) {
    return { created: false, copied: 0, failed: [] };
  }

  const collectionRoot = path.join(destinationRoot, backupFolderName());
  await fs.mkdir(collectionRoot, { recursive: true });

  const failed = [];
  let copied = 0;

  for (const file of files) {
    const relativePath = String(file.relativePath || '');
    const sourcePath = path.join(sourceRoot, relativePath);
    const targetPath = path.join(collectionRoot, relativePath);

    if (!ensureInsideRoot(sourceRoot, sourcePath) || !ensureInsideRoot(collectionRoot, targetPath)) {
      failed.push({ relativePath, reason: 'Path tidak valid.' });
      continue;
    }

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
      copied += 1;
    } catch (error) {
      failed.push({
        relativePath,
        reason: error && error.message ? error.message : 'Gagal menyalin file.'
      });
    }
  }

  return {
    created: true,
    folderPath: collectionRoot,
    copied,
    failed
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
