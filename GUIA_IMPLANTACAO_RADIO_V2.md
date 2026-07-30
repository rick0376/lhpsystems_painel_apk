# Painel LHPSYSTEMS — configuração central da rádio (v2)

Esta versão passa a controlar pelo painel os dados usados pelo **LHP Live Prayer** para entrar ao vivo. A senha DJ é criptografada antes de ser gravada no PostgreSQL e só é entregue, por HTTPS, a um usuário com licença e permissão de transmissão válidas no momento em que ele toca em iniciar.

## 1. Faça backup antes da implantação

- Exporte ou faça snapshot do banco PostgreSQL.
- Guarde uma cópia da versão atual do painel e do APK.
- Não apague nem altere a chave `RADIO_CONFIG_ENCRYPTION_KEY` depois de cadastrar a senha DJ.

## 2. Variáveis obrigatórias

Configure no ambiente de hospedagem do painel:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="uma-chave-grande-para-o-painel"
APK_JWT_SECRET="outra-chave-grande-para-os-aplicativos"
RADIO_CONFIG_ENCRYPTION_KEY="uma-chave-aleatoria-com-no-minimo-32-caracteres"
```

Gere valores aleatórios fortes. Não use os exemplos do arquivo `.env.example` em produção.

## 3. Banco de dados

Depois de publicar o código, execute:

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
```

A migração `20260730110000_add_radio_stream_config` cria a tabela de configuração e completa os campos de suporte que já existiam no schema.

## 4. Configuração indicada para a rádio mostrada

No painel, abra **Projetos → LHP Live Prayer → Configurar rádio** e preencha inicialmente:

- Host: `stream3.svrdedicado.org`
- Porta DJ: `4798`
- Porta pública: `8100`
- Usuário DJ: `live`
- Senha DJ: informe **somente a parte da senha**, sem o prefixo `live:`
- Mount point: `/`
- Bitrate: `128 kbps`
- Taxa: `44100 Hz`
- Canais: `Estéreo`
- TLS: desativado inicialmente, porque a configuração anterior usava TCP comum
- Permitir transmissão: ativado

No aplicativo antigo, o campo tinha o formato `live:suaSenhaDJ`. Na nova versão, usuário e senha ficam separados, mas o valor de autenticação enviado à rádio continua equivalente.

A imagem do SonicPanel mostra **Interrupção AutoDJ ativada**. Quando a fonte DJ for aceita, o painel da rádio deve interromper ou fazer o fade da programação automática e colocar a oração no ar.

## 5. Ordem de publicação

1. Publique primeiro o painel e aplique a migração.
2. Cadastre e salve a configuração da rádio.
3. Instale o novo APK em um aparelho de teste.
4. Entre novamente com o usuário do pastor; sessões da versão antiga não possuem o novo token.
5. Inicie uma oração curta enquanto escuta o player público.
6. Confira se o AutoDJ retorna após encerrar a transmissão.

## 6. Segurança e limitações

- A senha DJ não aparece na tela do aplicativo e não é salva no AsyncStorage.
- O token do aplicativo é assinado e vinculado ao usuário, projeto e dispositivo.
- A entrega da configuração pelo painel usa HTTPS.
- Se a opção TLS da fonte estiver desligada, senha e áudio ainda trafegam sem criptografia entre o celular e o SonicPanel. Para proteção ponta a ponta, confirme com o provedor uma porta de fonte TLS, use VPN ou adote futuramente um gateway de retransmissão.
- Não exponha a rota de banco nem as chaves de ambiente em capturas de tela ou repositórios.

## 7. Novas rotas

- `POST /api/apk/auth/login`: cria token assinado.
- `POST /api/apk/auth/validate`: revalida licença e renova token.
- `GET /api/apk/radio-config`: retorna apenas metadados, sem senha.
- `POST /api/apk/radio-config/stream`: retorna a credencial somente para iniciar a transmissão.
- `PUT /api/projects/:id/radio-config`: salva a configuração administrativa.

## 8. Troca ou perda da chave de criptografia

Se `RADIO_CONFIG_ENCRYPTION_KEY` for alterada ou perdida, o painel não conseguirá abrir as senhas já cadastradas. Cadastre novamente a senha DJ de cada projeto usando a nova chave.
