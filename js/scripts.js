// Variáveis e Constantes Globais
let usuarioLogado = null;
let pedidosCache = [];
let filtrosAtivos = {};

// Adicionado: Constantes para evitar erros de "not defined"
const CATEGORIAS = [
    { id: 'empresa', nome: 'Empresa' },
    { id: 'estudos', nome: 'Estudos' },
    { id: 'pessoal', nome: 'Pessoal' },
    { id: 'esportes', nome: 'Esportes' }
];

const ESTADOS_BRASIL = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];


// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    // Modificado: A verificação de usuário agora é a primeira coisa a ser feita e é assíncrona.
    await verificarUsuarioLogado(); 
    inicializarMenu();
    atualizarMenuLogado(); // Chamada movida para depois da verificação
    inicializarPagina();
});

// Verificar se usuário está logado
// MODIFICADO: Substituído localStorage pela verificação real do Supabase
async function verificarUsuarioLogado() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        usuarioLogado = session.user;
        console.log("Usuário logado:", usuarioLogado.email);
    } else {
        usuarioLogado = null;
    }
}


// Inicializar menu (sem alterações)
function inicializarMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuSidebar = document.querySelector('.menu-sidebar');
    const menuClose = document.querySelector('.menu-close');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuOverlay.classList.add('active');
            menuSidebar.classList.add('active');
        });
    }
    
    if (menuClose || menuOverlay) {
        const fecharMenu = () => {
            menuOverlay.classList.remove('active');
            menuSidebar.classList.remove('active');
        };
        
        if (menuClose) menuClose.addEventListener('click', fecharMenu);
        if (menuOverlay) menuOverlay.addEventListener('click', fecharMenu);
    }
}

// Atualizar menu baseado no login (sem alterações na lógica interna)
function atualizarMenuLogado() {
    const menuItems = document.querySelector('.menu-items');
    if (!menuItems) return;
    
    if (usuarioLogado) {
        menuItems.innerHTML = `
            <a href="index.html" class="menu-item">Início</a>
            <a href="dashboard.html" class="menu-item">Perfil</a>
            <a href="new-request.html" class="menu-item">Novo Pedido</a>
            <a href="config.html" class="menu-item">Configurações</a>
            <a href="regras.html" class="menu-item">Termos e Regras</a>
            <a href="#" class="menu-item" onclick="logout()">Sair</a>
        `;
    } else {
        menuItems.innerHTML = `
            <a href="index.html" class="menu-item">Início</a>
            <a href="login.html" class="menu-item">Entrar</a>
            <a href="register.html" class="menu-item">Cadastrar</a>
            <a href="regras.html" class="menu-item">Termos e Regras</a>
        `;
    }
}

// Inicializar página específica (sem alterações)
function inicializarPagina() {
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (pagina) {
        case 'index.html':
            inicializarFeed();
            break;
        case 'login.html':
            inicializarLogin();
            break;
        case 'register.html':
            inicializarRegistro();
            break;
        case 'new-request.html':
            inicializarNovoPedido();
            break;
        case 'dashboard.html':
            inicializarDashboard();
            break;
        case 'config.html':
            inicializarConfiguracoes();
            break;
    }
}

// Feed principal
function inicializarFeed() {
    carregarPedidos();
    inicializarFiltros();
    inicializarPesquisa();
}

// MODIFICADO: Carrega pedidos do Supabase em vez de dados de demonstração
async function carregarPedidos() {
    const { data, error } = await supabaseClient
        .from('pedidos') // Certifique-se que o nome da tabela é 'pedidos'
        .select('*')
        .order('created_at', { ascending: false }); // Ordena pelos mais recentes

    if (error) {
        console.error('Erro ao carregar pedidos:', error);
        return;
    }
    
    pedidosCache = data;
    renderizarFeed(pedidosCache);
}


function renderizarFeed(pedidos) {
    const feedContainer = document.querySelector('.feed-container');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';
    
    if (pedidos.length === 0) {
        feedContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">Nenhum pedido encontrado.</p>';
        return;
    }

    pedidos.forEach(pedido => {
        const pedidoElement = criarElementoPedido(pedido);
        feedContainer.appendChild(pedidoElement);
    });
}

// MODIFICADO: Simplificado para lidar apenas com imagem única
function criarElementoPedido(pedido) {
    const div = document.createElement('div');
    div.className = 'pedido-item';
    div.dataset.id = pedido.id;
    
    // Espera uma única URL de imagem em 'media_url'
    const mediaHtml = `
        <div class="pedido-media">
            <img src="${pedido.media_url}" alt="Foto do pedido: ${pedido.titulo}" class="pedido-image active">
        </div>
    `;
    
    div.innerHTML = `
        ${mediaHtml}
        <div class="pedido-actions">
            <button class="action-btn" onclick="verPerfil('${pedido.user_id}')">
                <span>👤</span>
            </button>
            <button class="action-btn btn-doar" onclick="abrirModalDoacao(${pedido.id})">
                <span>❤️</span>
            </button>
            <button class="action-btn" onclick="toggleFavorito(${pedido.id})">
                <span>⭐</span>
            </button>
            <button class="action-btn" onclick="compartilhar(${pedido.id})">
                <span>📤</span>
            </button>
        </div>
        <div class="pedido-info">
            <div class="pedido-titulo">${pedido.titulo}</div>
            <div class="pedido-descricao">${pedido.descricao}</div>
            <div class="pedido-meta">
                <span>${pedido.categoria}</span>
                <span>${pedido.estado}</span>
                <span>${pedido.status}</span>
            </div>
        </div>
    `;
    
    return div;
}

// REMOVIDO: Função inicializarVideos() não é mais necessária com apenas imagens.

// Filtros
function inicializarFiltros() {
    const filtrosToggle = document.querySelector('.filtros-toggle');
    const filtrosContent = document.querySelector('.filtros-content');
    
    if (filtrosToggle) {
        filtrosToggle.addEventListener('click', () => {
            filtrosContent.classList.toggle('active');
        });
    }
    
    preencherFiltros();
}

// MODIFICADO: Corrigido para usar o array de objetos CATEGORIAS
function preencherFiltros() {
    const categoriaSelect = document.getElementById('filtro-categoria');
    const estadoSelect = document.getElementById('filtro-estado');
    
    if (categoriaSelect) {
        CATEGORIAS.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id; // Usa o ID
            option.textContent = categoria.nome; // Mostra o Nome
            categoriaSelect.appendChild(option);
        });
    }
    
    if (estadoSelect) {
        ESTADOS_BRASIL.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado;
            option.textContent = estado;
            estadoSelect.appendChild(option);
        });
    }
}

// Restante das funções de filtro, pesquisa, modal, etc. (sem alterações críticas)
// ... (código omitido para brevidade, ele permanece o mesmo) ...

// Login
function inicializarLogin() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', fazerLogin);
    }
}

// MODIFICADO: Substituído simulação pelo login real do Supabase
async function fazerLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        alert('Erro no login: ' + error.message);
        return;
    }
    
    alert('Login realizado com sucesso!');
    window.location.href = 'index.html';
}

// Registro
function inicializarRegistro() {
    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', fazerRegistro);
    }
    
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', aplicarMascaraCPF);
    }
    
    const estadoSelect = document.getElementById('estado');
    if (estadoSelect) {
        ESTADOS_BRASIL.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado;
            option.textContent = estado;
            estadoSelect.appendChild(option);
        });
    }
}

function aplicarMascaraCPF(e) {
    let valor = e.target.value.replace(/\D/g, '');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = valor;
}

// MODIFICADO: Substituído simulação pelo registro real do Supabase
async function fazerRegistro(e) {
    e.preventDefault();
    
    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        cpf: document.getElementById('cpf').value,
        estado: document.getElementById('estado').value,
        senha: document.getElementById('senha').value,
        confirmarSenha: document.getElementById('confirmar-senha').value,
        termos: document.getElementById('termos').checked
    };
    
    if (dados.senha !== dados.confirmarSenha) {
        alert('Senhas não conferem');
        return;
    }
    
    if (!dados.termos) {
        alert('Você deve aceitar os termos e condições');
        return;
    }
    
    const { data, error } = await supabaseClient.auth.signUp({
        email: dados.email,
        password: dados.senha,
        options: {
            data: { // Dados adicionais para salvar no perfil
                full_name: dados.nome,
                username: dados.username,
                cpf: dados.cpf,
                estado: dados.estado
            }
        }
    });

    if (error) {
        alert('Erro no cadastro: ' + error.message);
        return;
    }
    
    alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação (se habilitado).');
    window.location.href = 'login.html';
}

// MODIFICADO: Logout real do Supabase
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// Novo pedido
function inicializarNovoPedido() {
    if (!usuarioLogado) {
        alert('Faça login para criar pedidos');
        window.location.href = 'login.html';
        return;
    }
    
    const form = document.getElementById('novo-pedido-form');
    if (form) {
        form.addEventListener('submit', criarPedido);
    }
    
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        CATEGORIAS.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            categoriaSelect.appendChild(option);
        });
    }
}

// MODIFICADO: Cria pedido real no Supabase
async function criarPedido(e) {
    e.preventDefault();
    
    // A verificação de limite de tempo deve ser feita no backend (com Edge Functions) para ser segura.
    // A verificação no frontend é apenas uma conveniência para o usuário.
    
    const dados = {
        titulo: document.getElementById('titulo').value,
        categoria: document.getElementById('categoria').value,
        descricao: document.getElementById('descricao').value,
        user_id: usuarioLogado.id, // Associa o pedido ao usuário logado
        // media_url: 'URL_DA_IMAGEM_APOS_UPLOAD' // Você precisará implementar o upload da imagem para o Storage
    };
    
    const { data, error } = await supabaseClient
        .from('pedidos')
        .insert([dados]);

    if (error) {
        alert('Erro ao criar pedido: ' + error.message);
        return;
    }
    
    alert('Pedido criado com sucesso!');
    window.location.href = 'index.html';
}

// Funções de Dashboard e Configurações (permanecem as mesmas, mas agora 'usuarioLogado' vem do Supabase)
// ... (código omitido para brevidade) ...
