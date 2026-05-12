const state = {
  src: null,
  dst: null,
  mode: 'full',
  entries: [],
  filter: 'all'
};

const ui = {
  srcField: document.getElementById('src-field'),
  dstField: document.getElementById('dst-field'),
  srcClear: document.getElementById('src-clear'),
  dstClear: document.getElementById('dst-clear'),
  srcLabel: document.getElementById('src-lbl'),
  dstLabel: document.getElementById('dst-lbl'),
  srcInfo: document.getElementById('src-info'),
  dstInfo: document.getElementById('dst-info'),
  modeName: document.getElementById('mode-name'),
  modeFull: document.getElementById('mode-full'),
  modePath: document.getElementById('mode-path'),
  modeDesc: document.getElementById('mode-desc'),
  runBtn: document.getElementById('run-btn'),
  statsRow: document.getElementById('stats-row'),
  total: document.getElementById('s-total'),
  ok: document.getElementById('s-ok'),
  missing: document.getElementById('s-missing'),
  extra: document.getElementById('s-extra'),
  dot: document.getElementById('dot'),
  progWrap: document.getElementById('prog-wrap'),
  progFill: document.getElementById('prog-fill'),
  logBody: document.getElementById('log-body'),
  tabs: document.getElementById('ftabs'),
  clearLogBtn: document.getElementById('btn-clear-log')
};

const modeDescriptions = {
  name: 'Mode ini membandingkan nama file saja tanpa ekstensi. Contoh: foto_001.jpg dan foto_001.png dianggap sama.',
  full: 'Mode ini membandingkan nama file beserta ekstensinya. Contoh: foto_001.jpg dan foto_001.png dianggap berbeda.',
  path: 'Mode ini membandingkan path relatif lengkap, jadi file dengan nama sama di subfolder berbeda tetap dianggap berbeda.'
};

function splitName(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return { nameOnly: filename, ext: '' };
  return {
    nameOnly: filename.slice(0, dot),
    ext: filename.slice(dot + 1).toLowerCase()
  };
}

function normalizeFiles(folder) {
  return folder.files.map((file) => {
    const parts = splitName(file.name);
    return { ...file, ...parts };
  });
}

function keyFor(file) {
  if (state.mode === 'name') return file.nameOnly.toLowerCase();
  if (state.mode === 'path') return file.relativePath.toLowerCase();
  return file.name.toLowerCase();
}

function fmtSize(bytes) {
  if (!bytes) return '?';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

function now() {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function addLog(message, type = 'info') {
  state.entries.push({ message, type, time: now() });
}

function renderBody(html) {
  ui.logBody.innerHTML = html;
}

function renderLog() {
  const entries = state.entries.filter((entry) => {
    if (state.filter === 'all') return true;
    if (state.filter === 'missing') return ['err', 'head', 'sep'].includes(entry.type);
    return ['ok', 'head', 'sep', 'info'].includes(entry.type);
  });

  if (!entries.length) {
    renderBody('<div class="empty-st"><p>Tidak ada entri</p></div>');
    return;
  }

  renderBody(entries.map((entry) => `
    <div class="ll ${entry.type}">
      <span class="lt">${entry.time}</span>
      <span class="lm">${esc(entry.message)}</span>
    </div>
  `).join(''));

  ui.logBody.scrollTop = ui.logBody.scrollHeight;
}

function updateFolderUi(type) {
  const folder = state[type];
  const field = type === 'src' ? ui.srcField : ui.dstField;
  const label = type === 'src' ? ui.srcLabel : ui.dstLabel;
  const info = type === 'src' ? ui.srcInfo : ui.dstInfo;

  field.classList.toggle('has-value', Boolean(folder));
  label.textContent = folder ? folder.folderPath : 'Klik untuk pilih folder...';
  info.textContent = folder ? `${folder.files.length.toLocaleString('id-ID')} file terbaca` : '';
  info.className = folder ? 'finfo ok' : 'finfo';
}

function refreshReady() {
  ui.runBtn.disabled = !(state.src && state.dst);
}

function setMode(mode) {
  state.mode = mode;
  ui.modeName.classList.toggle('active', mode === 'name');
  ui.modeFull.classList.toggle('active', mode === 'full');
  ui.modePath.classList.toggle('active', mode === 'path');
  ui.modeDesc.textContent = modeDescriptions[mode];
}

async function pickFolder(type) {
  const result = await window.fileChecker.pickFolder();
  if (!result) return;

  state[type] = {
    ...result,
    files: normalizeFiles(result)
  };

  updateFolderUi(type);
  refreshReady();
}

function clearFolder(type, event) {
  event.stopPropagation();
  state[type] = null;
  updateFolderUi(type);
  refreshReady();
}

function addComparisonPreviewLog(label, folder) {
  const samples = folder.files.slice(0, 5).map((file) => keyFor(file));
  addLog(`${label} preview : ${samples.length ? samples.join(' | ') : '-'}`, 'info');
  if (folder.files.length > 5) {
    addLog(`${label} lainnya : +${(folder.files.length - 5).toLocaleString('id-ID')} file`, 'info');
  }
}

async function runCheck() {
  state.entries = [];
  state.filter = 'all';
  ui.tabs.classList.remove('show');
  ui.clearLogBtn.disabled = true;
  ui.runBtn.disabled = true;
  ui.statsRow.classList.remove('visible');
  ui.dot.className = 'dot running';
  ui.progWrap.classList.add('show');
  ui.progFill.style.width = '18%';
  renderBody('<div class="empty-st"><p>Memproses folder...</p></div>');

  await new Promise((resolve) => setTimeout(resolve, 80));
  ui.progFill.style.width = '52%';

  const srcMap = new Map();
  const dstMap = new Map();

  state.src.files.forEach((file) => srcMap.set(keyFor(file), file));
  state.dst.files.forEach((file) => dstMap.set(keyFor(file), file));

  const missing = state.src.files
    .filter((file) => !dstMap.has(keyFor(file)))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const extra = state.dst.files
    .filter((file) => !srcMap.has(keyFor(file)))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const okCount = state.src.files.length - missing.length;
  const modeLabel = {
    name: 'Nama saja',
    full: 'Nama + ekstensi',
    path: 'Path relatif'
  }[state.mode];

  ui.progFill.style.width = '88%';

  addLog('=======================================', 'head');
  addLog('FILE CHECKER - HASIL PEMERIKSAAN', 'head');
  addLog('=======================================', 'head');
  addLog(`Folder sumber : ${state.src.folderPath}`, 'info');
  addLog(`Folder tujuan : ${state.dst.folderPath}`, 'info');
  addLog(`Mode cek      : ${modeLabel}`, 'info');
  addComparisonPreviewLog('Sumber', state.src);
  addComparisonPreviewLog('Tujuan', state.dst);
  addLog('---------------------------------------', 'sep');
  addLog(`Berhasil cocok: ${okCount.toLocaleString('id-ID')} file`, okCount > 0 ? 'ok' : 'info');
  addLog(`File hilang   : ${missing.length.toLocaleString('id-ID')} file`, missing.length > 0 ? 'err' : 'ok');
  addLog(`File ekstra   : ${extra.length.toLocaleString('id-ID')} file`, extra.length > 0 ? 'warn' : 'info');
  addLog('---------------------------------------', 'sep');

  if (!missing.length) {
    addLog('Semua file sumber ditemukan di folder tujuan.', 'ok');
  } else {
    addLog(`Daftar file hilang (${missing.length.toLocaleString('id-ID')} file):`, 'err');
    missing.forEach((file, index) => {
      addLog(`${String(index + 1).padStart(4, ' ')}. ${file.relativePath} [${fmtSize(file.size)}]`, 'err');
    });

    const collectionResult = await window.fileChecker.collectMissingFiles({
      sourceRoot: state.src.folderPath,
      destinationRoot: state.dst.folderPath,
      files: missing.map((file) => ({ relativePath: file.relativePath }))
    });

    addLog('---------------------------------------', 'sep');
    if (collectionResult.created) {
      addLog(`Folder pemisah dibuat: ${collectionResult.folderPath}`, 'warn');
      addLog(`File hilang yang disalin otomatis: ${collectionResult.copied.toLocaleString('id-ID')} file`, 'ok');

      if (collectionResult.failed.length) {
        addLog(`Gagal menyalin otomatis: ${collectionResult.failed.length.toLocaleString('id-ID')} file`, 'err');
        collectionResult.failed.forEach((item) => {
          addLog(`${item.relativePath} | ${item.reason}`, 'err');
        });
      }
    } else {
      addLog('Folder pemisah tidak dibuat karena tidak ada file yang perlu diproses.', 'info');
    }
  }

  if (extra.length) {
    addLog('---------------------------------------', 'sep');
    addLog(`File ekstra di tujuan (${extra.length.toLocaleString('id-ID')} file):`, 'warn');
    extra.forEach((file, index) => {
      addLog(`${String(index + 1).padStart(4, ' ')}. ${file.relativePath}`, 'warn');
    });
  }

  addLog('---------------------------------------', 'sep');
  addLog(`SELESAI | Sumber: ${state.src.files.length.toLocaleString('id-ID')} | Cocok: ${okCount.toLocaleString('id-ID')} | Hilang: ${missing.length.toLocaleString('id-ID')}`, 'head');

  ui.total.textContent = state.src.files.length.toLocaleString('id-ID');
  ui.ok.textContent = okCount.toLocaleString('id-ID');
  ui.missing.textContent = missing.length.toLocaleString('id-ID');
  ui.extra.textContent = extra.length.toLocaleString('id-ID');
  ui.statsRow.classList.add('visible');
  ui.tabs.classList.add('show');
  ui.clearLogBtn.disabled = false;
  ui.runBtn.disabled = false;
  ui.dot.className = 'dot done';
  ui.progFill.style.width = '100%';
  renderLog();

  setTimeout(() => ui.progWrap.classList.remove('show'), 250);
}

function clearLog() {
  state.entries = [];
  state.filter = 'all';
  ui.tabs.classList.remove('show');
  document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
  document.querySelector('.tab[data-filter="all"]').classList.add('active');
  ui.statsRow.classList.remove('visible');
  ui.total.textContent = '0';
  ui.ok.textContent = '0';
  ui.missing.textContent = '0';
  ui.extra.textContent = '0';
  ui.dot.className = 'dot';
  ui.clearLogBtn.disabled = true;
  renderBody(`
    <div class="empty-st">
      <p>Log sudah dihapus. Jalankan pengecekan lagi.</p>
    </div>
  `);
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    state.filter = tab.dataset.filter;
    document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    renderLog();
  });
});

ui.srcField.addEventListener('click', () => pickFolder('src'));
ui.dstField.addEventListener('click', () => pickFolder('dst'));
ui.srcClear.addEventListener('click', (event) => clearFolder('src', event));
ui.dstClear.addEventListener('click', (event) => clearFolder('dst', event));
ui.modeName.addEventListener('click', () => setMode('name'));
ui.modeFull.addEventListener('click', () => setMode('full'));
ui.modePath.addEventListener('click', () => setMode('path'));
ui.runBtn.addEventListener('click', runCheck);
ui.clearLogBtn.addEventListener('click', clearLog);

setMode('full');
