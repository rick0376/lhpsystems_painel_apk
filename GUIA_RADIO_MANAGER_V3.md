# Integração do LHP Radio Manager

1. Faça backup do banco.
2. Copie esta versão sobre o painel atual, preservando `.env` e `.git`.
3. Execute `npm install`, `npx prisma migrate deploy`, `npx prisma generate` e `npm run build`.
4. Publique na Vercel.
5. Crie um projeto chamado **LHP Radio Manager** com App Key `lhp_radio_manager_2026`.
6. Cadastre usuários nesse projeto e marque separadamente as permissões do Radio Manager.

As rotas antigas do LHP Live Prayer continuam compatíveis. O login por App Key agora também aceita diferenças entre maiúsculas e minúsculas.
