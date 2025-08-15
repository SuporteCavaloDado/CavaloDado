# CavaloDado - Site de Doação de Produtos Físicos

## 📋 Sobre o Projeto

O CavaloDado é uma plataforma gratuita que conecta pessoas que precisam de produtos físicos com aquelas dispostas a doar. Com foco na experiência mobile e design moderno, o site facilita a solidariedade e promove o compartilhamento responsável de recursos em todo o Brasil.

## 🎨 Características

- **Design Moderno**: Interface minimalista com cores dourado (#FFD700) e vermelho (#AA002A)
- **Mobile First**: Totalmente responsivo e otimizado para dispositivos móveis
- **Feed Interativo**: Scroll infinito estilo TikTok/Shorts com vídeos e imagens
- **Sistema Completo**: Cadastro, login, criação de pedidos, doações e acompanhamento

## 🚀 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (SaaS)
- **Hospedagem**: Vercel (gratuito)
- **Editor**: GitHub Web
- **APIs**: Google OAuth, ViaCEP

## 📁 Estrutura do Projeto

```
site-cavalo-dado/
├── index.html              # Página inicial com feed
├── login.html              # Login
├── register.html           # Cadastro
├── dashboard.html          # Dashboard do usuário
├── new-request.html        # Criar novo pedido
├── config.html             # Configurações
├── regras.html             # Termos e regras
├── forgot-password.html    # Recuperar senha
├── README.md               # Documentação
├── todo.md                 # Lista de tarefas
├── PROJETO_COMPLETO.md     # Arquivo principal
├── css/
│   └── styles.css          # Estilos completos
├── js/
│   └── scripts.js          # Lógica JavaScript
├── assets/
│   └── logo.svg            # Logo
└── supabase/
    └── supabase-config.js  # Configuração Supabase
```

## ⚙️ Configuração

### Supabase
- URL: `https://ipikrqsqcjtzjuabyqkz.supabase.co`
- API Key: Configurada em `supabase/supabase-config.js`

### Deploy no Vercel
1. Conecte o repositório GitHub ao Vercel
2. Configure como projeto estático
3. Deploy automático a cada push

## 🔧 Funcionalidades

### Sistema de Usuários
- Cadastro com validação de CPF e e-mail único
- Login com Google OAuth
- Recuperação de senha
- Perfil público e configurações

### Sistema de Pedidos
- Criação com vídeo (60s) ou até 10 fotos
- Categorias: Empresa, Estudos, Pessoal, Esportes
- Limite de 1 pedido a cada 2 horas
- Status: Disponível, Pendente, Concluído

### Sistema de Doações
- Doação sem necessidade de cadastro
- Código de rastreio obrigatório (min. 13 caracteres)
- Endereço completo com botões de cópia
- Acompanhamento de entregas

### Filtros e Pesquisa
- Filtros por categoria, estado, status e data
- Pesquisa em tempo real
- Interface minimizada por padrão

## 📱 Navegação

### Menu (Não Logado)
- Início
- Entrar
- Cadastrar
- Termos e Regras

### Menu (Logado)
- Início
- Perfil
- Novo Pedido
- Histórico
- Progresso
- Favoritos
- Termos e Regras
- Sair

## 🚫 Produtos Proibidos

- Armas
- Perecíveis
- Dinheiro ou transferência bancária
- Animais ou seres vivos
- Serviços
- Drogas lícitas e ilícitas
- Veículos que exigem CNH
- Pagamentos de boletos
- Ativos financeiros
- Imóveis

## 📞 Suporte

E-mail: suporte.cavalodado@gmail.com

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

**Desenvolvido com ❤️ para conectar pessoas e promover a solidariedade**

