const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const low     = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Diretórios ─────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE     = path.join(__dirname, 'db.json');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Banco de dados (JSON flat-file) ────────────────────────────────────
const adapter = new FileSync(DB_FILE);
const db      = low(adapter);
db.defaults({ vistorias: [] }).write();

// ── Upload de imagens ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB por foto
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  }
});

// ── Middlewares ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// ── API ────────────────────────────────────────────────────────────────

// POST /api/upload  — envia fotos, retorna URLs
app.post('/api/upload', upload.array('fotos', 20), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ erro: 'Nenhuma imagem enviada' });
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

// POST /api/vistorias — salva uma vistoria completa
app.post('/api/vistorias', (req, res) => {
  try {
    const vistoria = {
      id:          uuidv4(),
      criadoEm:   new Date().toISOString(),
      ...req.body
    };
    db.get('vistorias').push(vistoria).write();
    res.status(201).json({ ok: true, id: vistoria.id });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// GET /api/vistorias — lista todas
app.get('/api/vistorias', (req, res) => {
  const { tipo, busca } = req.query;
  let lista = db.get('vistorias').value();
  if (tipo)  lista = lista.filter(v => v.tipo === tipo);
  if (busca) lista = lista.filter(v =>
    v.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    v.tecnico?.toLowerCase().includes(busca.toLowerCase())
  );
  // retorna sem as fotos na listagem para não pesar
  const resumo = lista.map(v => ({
    id: v.id, nome: v.nome, tipo: v.tipo, data: v.data,
    tecnico: v.tecnico, endereco: v.endereco,
    lat: v.lat, lon: v.lon,
    notaChegada: v.notaChegada, totalFotos: v.totalFotos,
    criadoEm: v.criadoEm,
    notaMedia: calcNotaMedia(v)
  }));
  res.json(resumo);
});

// GET /api/vistorias/:id — detalhe completo
app.get('/api/vistorias/:id', (req, res) => {
  const v = db.get('vistorias').find({ id: req.params.id }).value();
  if (!v) return res.status(404).json({ erro: 'Vistoria não encontrada' });
  res.json(v);
});

// DELETE /api/vistorias/:id
app.delete('/api/vistorias/:id', (req, res) => {
  const v = db.get('vistorias').find({ id: req.params.id }).value();
  if (!v) return res.status(404).json({ erro: 'Não encontrada' });
  // remover arquivos de foto
  if (v.fotosChegada) v.fotosChegada.forEach(url => rmFile(url));
  if (v.itens) v.itens.forEach(it => (it.fotos||[]).forEach(url => rmFile(url)));
  db.get('vistorias').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  const lista = db.get('vistorias').value();
  res.json({
    total:      lista.length,
    torres:     lista.filter(v => v.tipo === 'torre').length,
    pops:       lista.filter(v => v.tipo === 'pop').length,
    totalFotos: lista.reduce((a, v) => a + (v.totalFotos||0), 0),
    atencao:    lista.filter(v => v.notaChegada <= 2 || (v.itens||[]).some(i => i.nota > 0 && i.nota <= 2)).length,
  });
});

// Helpers
function calcNotaMedia(v) {
  const notas = (v.itens||[]).map(i => i.nota).filter(n => n > 0);
  if (!notas.length) return v.notaChegada || 0;
  return Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
}
function rmFile(url) {
  try { fs.unlinkSync(path.join(__dirname, url)); } catch(e) {}
}

// Fallback SPA
app.get('/{*path}', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () => {
  console.log(`✅  VistoriaISP rodando em http://localhost:${PORT}`);
  console.log(`📁  Banco de dados: ${DB_FILE}`);
  console.log(`🖼️   Uploads: ${UPLOADS_DIR}`);
});
