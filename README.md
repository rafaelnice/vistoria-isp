# VistoriaISP — Due Diligence M&A

Sistema completo de vistoria técnica de campo para processos de **aquisição de provedores de internet (ISP)**.

---

## O que o sistema faz

- Técnico abre no **celular** e preenche o checklist no local (Torre ou PoP)
- Tira **fotos diretamente** de cada item — várias fotos por item
- Captura **coordenadas GPS** automaticamente
- Envia tudo para o **servidor central**
- Gestor acompanha todas as vistorias no **painel de gestão**

---

## Estrutura do projeto

```
vistoria-isp/
├── server.js          ← Backend Node.js (API REST)
├── package.json
├── db.json            ← Banco de dados (criado automaticamente)
├── uploads/           ← Fotos enviadas (criado automaticamente)
└── public/
    └── index.html     ← Frontend completo (app + painel)
```

---

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor
npm start

# 3. Abrir no navegador
http://localhost:3000
```

Para uso no celular na mesma rede Wi-Fi:
```
http://[IP_DO_SEU_COMPUTADOR]:3000
```

---

## Deploy em produção (Render.com — gratuito)

1. Crie conta em https://render.com
2. Crie **New → Web Service**
3. Conecte ao repositório Git (ou use "Deploy from existing code")
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Clique **Deploy**

O sistema ficará disponível numa URL pública como:
`https://vistoria-isp.onrender.com`

Todos os técnicos acessam essa mesma URL pelo celular.

---

## Deploy no Railway (alternativa)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

---

## API REST

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/vistorias | Lista todas as vistorias |
| GET | /api/vistorias/:id | Detalhe de uma vistoria |
| POST | /api/vistorias | Salva nova vistoria |
| DELETE | /api/vistorias/:id | Remove uma vistoria |
| POST | /api/upload | Faz upload de fotos |
| GET | /api/stats | Estatísticas gerais |
| GET | /uploads/:arquivo | Acessa foto enviada |

### Filtros disponíveis
```
GET /api/vistorias?tipo=torre
GET /api/vistorias?tipo=pop
GET /api/vistorias?busca=matriz
```

---

## Limites e configurações

| Item | Valor padrão |
|------|-------------|
| Tamanho máximo por foto | 15 MB |
| Fotos por item | até 20 |
| Banco de dados | JSON flat-file (db.json) |
| Porta | 3000 (ou variável PORT) |

---

## Evolução sugerida

Para um sistema mais robusto em produção:

1. **Banco de dados**: Migrar de JSON para PostgreSQL (Neon.tech — gratuito)
2. **Armazenamento de fotos**: Migrar para Cloudinary ou AWS S3
3. **Autenticação**: Adicionar login por técnico (JWT)
4. **Relatório PDF**: Exportar dossiê completo por estrutura
5. **Mapa**: Visualizar todos os sites no mapa (Google Maps / Leaflet)

---

## Suporte

Desenvolvido como parte do processo de Due Diligence M&A para ISPs.
