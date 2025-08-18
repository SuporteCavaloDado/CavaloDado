// Variáveis globais
let usuarioLogado = null;
let pedidosCache = [];
let filtrosAtivos = {};

// Constantes (substitua pelos valores reais)
const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
];
const CATEGORIAS = ['Estudos', 'Roupas', 'Alimentos', 'Móveis', 'Outros'];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarUsuarioLogado();
    inicializarMenu();
    inicializarPagina();
});

// Verificar se usuário está logado
async function verificarUsuarioLogado() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
        console.error('Erro ao verificar sessão:', error);
        return;
    }
    
    if (session) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        usuarioLogado = {
            id: user.id,
            email: user.email,
            nome: user.user_metadata.nome,
            nome_usuario: user.user_metadata.nome_usuario,
            estado: user.user_metadata.estado
        };
        atualizarMenuLogado();
    }
}

// Inicializar menu
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

// Atualizar menu baseado no login
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

// Inicializar página específica
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

// Função para validar o nome de usuário
async function validateUsername(nome_usuario) {
    const { data, error } = await supabaseClient
        .from('perfis')
        .select('nome_usuario')
        .eq('nome_usuario', nome_usuario);
    if (error) {
        console.error('Erro ao validar nome de usuário:', error);
        return false;
    }
    return data.length === 0; // Retorna true se o nome de usuário estiver disponível
}

// Registro
function inicializarRegistro() {
    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', fazerRegistro);
    }
    
    // Preencher estados
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

async function fazerRegistro(e) {
    e.preventDefault();
    
    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        nome_usuario: document.getElementById('nome_usuario').value,
        estado: document.getElementById('estado').value,
        senha: document.getElementById('senha').value,
        confirmarSenha: document.getElementById('confirmar-senha').value,
        termos: document.getElementById('termos').checked
    };
    
    // Validações básicas
    if (dados.senha !== dados.confirmarSenha) {
        alert('Senhas não conferem');
        return;
    }
    
    if (!dados.termos) {
        alert('Você deve aceitar os termos e condições');
        return;
    }
    
    if (!/^[A-Za-z0-9_]+$/.test(dados.nome_usuario)) {
        alert('O nome de usuário deve conter apenas letras, números e underscore.');
        return;
    }
    
    if (!(await validateUsername(dados.nome_usuario))) {
        alert('Nome de usuário já está em uso.');
        return;
    }
    
    // Cadastro no Supabase Authentication com metadados
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: dados.email,
        password: dados.senha,
        options: {
            data: {
                nome: dados.nome,
                nome_usuario: dados.nome_usuario,
                estado: dados.estado
            }
        }
    });
    
    if (authError) {
        console.error('Erro no cadastro:', authError);
        alert('Erro ao criar conta. Verifique o e-mail ou tente novamente.');
        return;
    }
    
    // O trigger handle_new_user insere os dados em 'usuarios' e 'perfis'
    alert('Cadastro realizado com sucesso! Você será redirecionado.');
    window.location.href = 'index.html';
}

// Cadastro com Google
async function cadastroComGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/index.html'
        }
    });
    if (error) {
        console.error('Erro no cadastro com Google:', error);
        alert('Erro ao realizar cadastro com Google. Tente novamente.');
    }
}

// Logout
async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error);
        return;
    }
    usuarioLogado = null;
    window.location.href = 'index.html';
}

// Feed principal
function inicializarFeed() {
    carregarPedidos();
    inicializarFiltros();
    inicializarPesquisa();
}

function carregarPedidos() {
    // Simular dados para demonstração
    const pedidosDemo = [
        {
            id: 1,
            titulo: 'Notebook para estudos',
            descricao: 'Preciso de um notebook para continuar meus estudos em programação',
            categoria: 'Estudos',
            estado: 'SP',
            status: 'Disponível',
            usuario: 'João Silva',
            data: '2025-08-15',
            media: { tipo: 'imagem', url: 'https://placehold.co/400x600?text=Notebook' },
            endereco: {
                nome: 'João Silva',
                rua: 'Rua das Flores, 123',
                bairro: 'Centro',
                cidade: 'São Paulo',
                estado: 'SP',
                cep: '01234-567'
            }
        },
        {
            id: 2,
            titulo: 'Material escolar',
            descricao: 'Cadernos, lápis e canetas para o ano letivo',
            categoria: 'Estudos',
            estado: 'RJ',
            status: 'Disponível',
            usuario: 'Maria Santos',
            data: '2025-08-14',
            media: { tipo: 'imagem', url: 'https://placehold.co/400x600?text=Material' },
            endereco: {
                nome: 'Maria Santos',
                rua: 'Av. Copacabana, 456',
                bairro: 'Copacabana',
                cidade: 'Rio de Janeiro',
                estado: 'RJ',
                cep: '22070-001'
            }
        }
    ];
    
    pedidosCache = pedidosDemo;
    renderizarFeed(pedidosCache);
}

function renderizarFeed(pedidos) {
    const feedContainer = document.querySelector('.feed-container');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';
    
    pedidos.forEach(pedido => {
        const pedidoElement = criarElementoPedido(pedido);
        feedContainer.appendChild(pedidoElement);
    });
}

function criarElementoPedido(pedido) {
    const div = document.createElement('div');
    div.className = 'pedido-item';
    div.dataset.id = pedido.id;
    
    const mediaHtml = `
        <div class="pedido-media">
            <img src="${pedido.media.url}" alt="Imagem do pedido" class="pedido-image">
        </div>
    `;
    
    div.innerHTML = `
        ${mediaHtml}
        <div class="pedido-actions">
            <button class="action-btn" onclick="verPerfil('${pedido.usuario}')">
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

// Filtros
function inicializarFiltros() {
    const filtrosToggle = document.querySelector('.filtros-toggle');
    const filtrosContent = document.querySelector('.filtros-content');
    
    if (filtrosToggle) {
        filtrosToggle.addEventListener('click', () => {
            filtrosContent.classList.toggle('active');
        });
    }
    
    // Preencher selects de filtros
    preencherFiltros();
}

function preencherFiltros() {
    const categoriaSelect = document.getElementById('filtro-categoria');
    const estadoSelect = document.getElementById('filtro-estado');
    
    if (categoriaSelect) {
        CATEGORIAS.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
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

function aplicarFiltros() {
    const categoria = document.getElementById('filtro-categoria')?.value;
    const estado = document.getElementById('filtro-estado')?.value;
    const status = document.getElementById('filtro-status')?.value;
    const data = document.getElementById('filtro-data')?.value;
    
    filtrosAtivos = { categoria, estado, status, data };
    
    let pedidosFiltrados = pedidosCache.filter(pedido => {
        if (categoria && pedido.categoria !== categoria) return false;
        if (estado && pedido.estado !== estado) return false;
        if (status && pedido.status !== status) return false;
        // Implementar filtro de data conforme necessário
        return true;
    });
    
    renderizarFeed(pedidosFiltrados);
}

function limparFiltros() {
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-status').value = '';
    document.getElementById('filtro-data').value = '';
    
    filtrosAtivos = {};
    renderizarFeed(pedidosCache);
}

// Pesquisa
function inicializarPesquisa() {
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', realizarPesquisa);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') realizarPesquisa();
        });
    }
}

function realizarPesquisa() {
    const termo = document.querySelector('.search-input')?.value.toLowerCase();
    if (!termo) return;
    
    const resultados = pedidosCache.filter(pedido => 
        pedido.titulo.toLowerCase().includes(termo) ||
        pedido.descricao.toLowerCase().includes(termo) ||
        pedido.categoria.toLowerCase().includes(termo)
    );
    
    renderizarFeed(resultados);
}

// Modal de doação
function abrirModalDoacao(pedidoId) {
    const pedido = pedidosCache.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Doar para: ${pedido.titulo}</h3>
                <button class="modal-close" onclick="fecharModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="endereco-completo">
                    <h4>Endereço de entrega:</h4>
                    <div class="endereco-linha">
                        <span>${pedido.endereco.nome}</span>
                        <button onclick="copiarTexto('${pedido.endereco.nome}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${pedido.endereco.rua}</span>
                        <button onclick="copiarTexto('${pedido.endereco.rua}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${pedido.endereco.bairro}</span>
                        <button onclick="copiarTexto('${pedido.endereco.bairro}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${pedido.endereco.cidade} - ${pedido.endereco.estado}</span>
                        <button onclick="copiarTexto('${pedido.endereco.cidade} - ${pedido.endereco.estado}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${pedido.endereco.cep}</span>
                        <button onclick="copiarTexto('${pedido.endereco.cep}')">Copiar</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Código de rastreio *</label>
                    <input type="text" id="codigo-rastreio" class="form-input" 
                           placeholder="Digite o código de rastreio (mín. 13 caracteres)" 
                           minlength="13" required>
                </div>
                
                <div class="form-checkbox">
                    <input type="checkbox" id="aceito-responsabilidade" required>
                    <label for="aceito-responsabilidade">
                        Concordo com as responsabilidades da doação
                    </label>
                </div>
                
                <button class="btn btn-primary" onclick="confirmarDoacao(${pedidoId})">
                    Confirmar Doação
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function confirmarDoacao(pedidoId) {
    const codigo = document.getElementById('codigo-rastreio').value;
    const aceito = document.getElementById('aceito-responsabilidade').checked;
    
    if (!codigo || codigo.length < 13) {
        alert('Código de rastreio deve ter pelo menos 13 caracteres');
        return;
    }
    
    if (!aceito) {
        alert('Você deve concordar com as responsabilidades');
        return;
    }
    
    // Atualizar status do pedido
    const pedido = pedidosCache.find(p => p.id === pedidoId);
    if (pedido) {
        pedido.status = 'Pendente';
        pedido.codigoRastreio = codigo;
    }
    
    alert('Doação confirmada! Obrigado por ajudar.');
    fecharModal();
    renderizarFeed(pedidosCache);
}

function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert('Texto copiado!');
    });
}

function fecharModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Funções de ação
function verPerfil(usuario) {
    window.location.href = `dashboard.html?usuario=${encodeURIComponent(usuario)}`;
}

function toggleFavorito(pedidoId) {
    if (!usuarioLogado) {
        alert('Faça login para favoritar pedidos');
        return;
    }
    
    let favoritos = JSON.parse(localStorage.getItem('cavalodado_favoritos') || '[]');
    const index = favoritos.indexOf(pedidoId);
    
    if (index === -1) {
        favoritos.push(pedidoId);
        alert('Adicionado aos favoritos!');
    } else {
        favoritos.splice(index, 1);
        alert('Removido dos favoritos!');
    }
    
    localStorage.setItem('cavalodado_favoritos', JSON.stringify(favoritos));
}

function compartilhar(pedidoId) {
    const url = `${window.location.origin}/index.html?pedido=${pedidoId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'CavaloDado - Pedido de Doação',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copiado para compartilhamento!');
        });
    }
}

// Login
function inicializarLogin() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', fazerLogin);    
    }
}

async function fazerLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password: senha
    });
    
    if (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login. Verifique suas credenciais.');
        return;
    }
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    usuarioLogado = {
        id: user.id,
        email: user.email,
        nome: user.user_metadata.nome,
        nome_usuario: user.user_metadata.nome_usuario,
        estado: user.user_metadata.estado
    };
    
    alert('Login realizado com sucesso!');
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
    
    // Preencher categorias
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        CATEGORIAS.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaSelect.appendChild(option);
        });
    }
}

function criarPedido(e) {
    e.preventDefault();
    
    // Verificar limite de tempo
    const ultimoPedido = localStorage.getItem('cavalodado_ultimo_pedido');
    if (ultimoPedido) {
        const agora = new Date().getTime();
        const ultimo = new Date(ultimoPedido).getTime();
        const diferencaHoras = (agora - ultimo) / (1000 * 60 * 60);
        
        if (diferencaHoras < CONFIG.INTERVALO_PEDIDOS_HORAS) {
            alert(`Você deve aguardar ${CONFIG.INTERVALO_PEDIDOS_HORAS} horas entre pedidos`);
            return;
        }
    }
    
    const dados = {
        titulo: document.getElementById('titulo').value,
        categoria: document.getElementById('categoria').value,
        descricao: document.getElementById('descricao').value
    };
    
    // Simular criação
    localStorage.setItem('cavalodado_ultimo_pedido', new Date().toISOString());
    alert('Pedido criado com sucesso!');
    window.location.href = 'index.html';
}

// Dashboard
function inicializarDashboard() {
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }
    
    const hash = window.location.hash.substring(1);
    
    switch (hash) {
        case 'historico':
            mostrarHistorico();
            break;
        case 'favoritos':
            mostrarFavoritos();
            break;
        default:
            mostrarPerfil();
    }
}

function mostrarPerfil() {
    const content = document.getElementById('dashboard-content');
    if (content) {
        content.innerHTML = `
            <h2>Meu Perfil</h2>
            <div class="card">
                <h3>${usuarioLogado.nome}</h3>
                <p>@${usuarioLogado.nome_usuario}</p>
                <p>Estado: ${usuarioLogado.estado}</p>
                <a href="config.html" class="btn btn-primary">Editar Perfil</a>
            </div>
        `;
    }
}

function mostrarHistorico() {
    const content = document.getElementById('dashboard-content');
    if (content) {
        content.innerHTML = `
            <h2>Meu Histórico</h2>
            <div class="card">
                <p>Seus pedidos e doações aparecerão aqui.</p>
            </div>
        `;
    }
}

function mostrarFavoritos() {
    const content = document.getElementById('dashboard-content');
    if (content) {
        content.innerHTML = `
            <h2>Meus Favoritos</h2>
            <div class="card">
                <p>Seus pedidos favoritos aparecerão aqui.</p>
            </div>
        `;
    }
}

function carregarHistorico() {
    const { data: { user } } = supabaseClient.auth.getUser();
    if (!user) return;

    supabaseClient.from('pedidos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data: pedidos, error }) => {
        if (error) return console.error(error);

        const tbody = document.getElementById('historico-body');
        pedidos.forEach(pedido => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="historico-nome" data-id="${pedido.id}" data-creator="${pedido.user_id}">${pedido.titulo}</td>
                <td>${pedido.categoria}</td>
                <td>${new Date(pedido.created_at).toLocaleDateString('pt-BR')}</td>
                <td>${pedido.status}</td>
                <td><span class="expand-btn">▼</span></td>
            `;
            const expandRow = document.createElement('tr');
            expandRow.innerHTML = `<td colspan="5"><div class="expand-content"></div></td>`;
            tbody.appendChild(row);
            tbody.appendChild(expandRow);

            const expandContent = expandRow.querySelector('.expand-content');
            if (pedido.status === 'Disponível') {
                expandContent.innerHTML = '<button class="delete-btn">Excluir</button>';
                expandContent.querySelector('.delete-btn').onclick = () => {
                    if (confirm('Exclusão permanente. Confirmar?')) {
                        supabaseClient.from('pedidos').delete().eq('id', pedido.id).then(() => carregarHistorico());
                    }
                };
            } else if (pedido.status === 'Pendente') {
                expandContent.innerHTML = `
                    <div><input value="${pedido.tracking_code || ''}" readonly><button class="copy-btn">Copiar</button></div>
                    <div><label><input type="checkbox" name="opt" value="invalido">Código Inválido</label>
                        <label><input type="checkbox" name="opt" value="entregue">Produto Entregue</label></div>
                    <p class="note">Conferir o código com atenção.</p>
                    <button class="confirm-btn">Confirmar</button>
                `;
                const [invalido, entregue] = expandContent.querySelectorAll('input[name="opt"]');
                const confirmBtn = expandContent.querySelector('.confirm-btn');
                expandContent.querySelector('.copy-btn').onclick = () => navigator.clipboard.writeText(pedido.tracking_code || '');
                [invalido, entregue].forEach(cb => cb.onchange = () => { if (cb.checked) [invalido, entregue].forEach(other => other !== cb && (other.checked = false)); });
                confirmBtn.onclick = () => {
                    const checked = expandContent.querySelector('input[name="opt"]:checked');
                    if (!checked) return alert('Selecione uma opção');
                    const updates = { status: checked.value === 'invalido' ? 'Disponível' : 'Concluído' };
                    if (updates.status === 'Concluído') updates.completion_date = new Date().toISOString();
                    supabaseClient.from('pedidos').update(updates).eq('id', pedido.id).then(() => carregarHistorico());
                };
            } else if (pedido.status === 'Concluído') {
                expandContent.innerHTML = `<p>Finalizado em: ${new Date(pedido.completion_date).toLocaleDateString('pt-BR')}</p>`;
            }
        });

        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.onclick = (e) => {
                const expand = e.target.closest('tr').nextElementSibling.querySelector('.expand-content');
                expand.style.display = expand.style.display === 'block' ? 'none' : 'block';
                e.target.textContent = expand.style.display === 'block' ? '▲' : '▼';
            };
        });

        document.querySelectorAll('.historico-nome').forEach(nome => {
            nome.onclick = () => {
                const id = nome.dataset.id;
                const creator = nome.dataset.creator;
                window.location.href = `perfil.html?user=${creator}&pedido=${id}`;
            };
        });
    });
}

// Configurações
function inicializarConfiguracoes() {
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }
    
    // Preencher formulário com dados do usuário
    preencherDadosUsuario();
}

function preencherDadosUsuario() {
    if (usuarioLogado) {
        document.getElementById('nome').value = usuarioLogado.nome || '';
        document.getElementById('email').value = usuarioLogado.email || '';
        document.getElementById('nome_usuario').value = usuarioLogado.nome_usuario || '';
    }
}

// Encaminhar Pedido para Perfil 
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('pedido-titulo')) {
        const pedidoId = e.target.closest('.pedido-item').dataset.id;
        window.location.href = `dashboard.html?id=${pedidoId}`;
    }
});
