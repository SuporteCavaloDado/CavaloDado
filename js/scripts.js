// Variáveis globais
let usuarioLogado = null;
let pedidosCache = [];
let filtrosAtivos = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarUsuarioLogado();
    inicializarMenu();
    inicializarPagina();
});

// Verificar se usuário está logado
function verificarUsuarioLogado() {
    const token = localStorage.getItem('cavalodado_token');
    const usuario = localStorage.getItem('cavalodado_usuario');
    
    if (token && usuario) {
        usuarioLogado = JSON.parse(usuario);
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
            <a href="javascript:void(0)" class="menu-item" onclick="logout()">Sair</a>
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
    usuarioLogado = JSON.parse(localStorage.getItem('cavalodado_usuario')) || null;
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !usuarioLogado) {
            supabase.auth.getUser().then(({ data: userData, error }) => {
                if (!error && userData.user) {
                    usuarioLogado = {
                        id: userData.user.id,
                        nome: userData.user.user_metadata.nome || 'Usuário',
                        email: userData.user.email,
                        username: userData.user.user_metadata.username || '',
                        estado: userData.user.user_metadata.estado || '',
                        termos: userData.user.user_metadata.termos || true,
                        bio: userData.user.user_metadata.bio || ''
                    };
                    localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));
                }
                atualizarMenuLogado();
            });
        } else {
            atualizarMenuLogado();
        }
    });
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
function inicializarLogin() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            const email = document.getElementById('email')?.value;
            const senha = document.getElementById('senha')?.value;
            if (!email || !senha) {
                showError('Preencha e-mail e senha.');
                return;
            }
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password: senha
                });
                if (error) throw error;
                usuarioLogado = {
                    id: data.user.id,
                    nome: userData.user.user_metadata.nome || 'Usuário',
                    email: data.user.email,
                    username: data.user.user_metadata.username || '',
                    estado: data.user.user_metadata.estado || '',
                    termos: data.user.user_metadata.termos || false,
                    bio: data.user.user_metadata.bio || ''
                };
                localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));
                atualizarMenuLogado();
                window.location.href = '/index.html';
            } catch (error) {
                showError('Erro ao logar: ' + error.message);
            }
        });
    }
}

function inicializarRegistro() {
    const estadoSelect = document.getElementById('estado');
    if (estadoSelect) {
        estadoSelect.innerHTML = '<option value="">Selecione seu estado</option>';
        ESTADOS_BRASIL.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado;
            option.textContent = estado;
            estadoSelect.appendChild(option);
        });
    } else {
        console.error('Elemento <select> de estado não encontrado. Verifique o ID "estado" no HTML.');
    }
}

// Configuração
function inicializarConfiguracoes() {
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }
    preencherDadosUsuario();
    const errorMessage = document.getElementById('error-message');
    if (!usuarioLogado.username || !usuarioLogado.estado) {
        if (errorMessage) errorMessage.innerHTML = '<p style="color: red;">Complete seu perfil (usuário e endereço).</p>';
    }
    const perfilForm = document.getElementById('perfil-form');
    if (perfilForm) {
        perfilForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            const dados = {
                nome: document.getElementById('nome')?.value || '',
                username: document.getElementById('username')?.value || '',
                bio: document.getElementById('bio')?.value || ''
            };
            if (!dados.username) {
                showError('Preencha o nome de usuário.');
                return;
            }
            try {
                const { error } = await supabase.auth.updateUser({ data: dados });
                if (error) throw error;
                Object.assign(usuarioLogado, dados);
                localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));
                alert('Perfil atualizado com sucesso!');
            } catch (error) {
                showError('Erro ao atualizar perfil: ' + error.message);
            }
        });
    }
    const enderecoForm = document.getElementById('endereco-form');
    if (enderecoForm) {
        enderecoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            const dados = {
                estado: document.getElementById('estado-endereco')?.value || ''
            };
            if (!dados.estado) {
                showError('Preencha o estado no endereço.');
                return;
            }
            try {
                const { error } = await supabase.auth.updateUser({ data: dados });
                if (error) throw error;
                Object.assign(usuarioLogado, dados);
                localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));
                alert('Endereço atualizado com sucesso!');
            } catch (error) {
                showError('Erro ao atualizar endereço: ' + error.message);
            }
        });
    }
}

// Salvar Endereço
async function salvarEndereco(event) {
    event.preventDefault();
    console.log('Salvando endereço...');
    try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Erro ao obter sessão:', sessionError.message);
            alert('Erro ao obter sessão: ' + sessionError.message);
            return;
        }
        if (!session || !session.session) {
            console.error('Nenhuma sessão encontrada');
            alert('Nenhuma sessão encontrada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        const userId = session.session.user.id;
        console.log('Usuário ID:', userId);
        if (!userId) {
            console.error('ID de usuário inválido');
            alert('ID de usuário inválido. Tente novamente.');
            return;
        }

        const cep = document.getElementById('cep').value.trim();
        const rua = document.getElementById('rua').value.trim();
        const numero = document.getElementById('numero').value.trim();
        const complemento = document.getElementById('complemento').value.trim();
        const bairro = document.getElementById('bairro').value.trim();
        const cidade = document.getElementById('cidade').value.trim();
        const estado_endereco = document.getElementById('estado-endereco').value;

        console.log('Dados do endereço:', { userId, cep, rua, numero, complemento, bairro, cidade, estado_endereco });

        if (!cep.match(/^\d{5}-\d{3}$/)) {
            console.log('CEP inválido');
            alert('CEP inválido. Use o formato 00000-000.');
            return;
        }
        if (!rua || !numero || !bairro || !cidade) {
            console.log('Campos obrigatórios não preenchidos');
            alert('Preencha todos os campos obrigatórios.');
            return;
        }
        if (!ESTADOS_BRASIL.includes(estado_endereco)) {
            console.log('Estado inválido');
            alert('Selecione um estado válido.');
            return;
        }

        let result, error;
        const { data: existingAddress, error: selectError } = await supabase
            .from('endereco')
            .select('id')
            .eq('usuario_id', userId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Erro ao verificar endereço existente:', selectError.message);
            alert('Erro ao verificar endereço: ' + selectError.message);
            return;
        }

        if (existingAddress) {
            console.log('Atualizando endereço existente');
            ({ data: result, error } = await supabase
                .from('endereco')
                .update({ cep, rua, numero, complemento, bairro, cidade, estado_endereco, updated_at: new Date() })
                .eq('usuario_id', userId)
                .select()
                .single());
        } else {
            console.log('Inserindo novo endereço');
            ({ data: result, error } = await supabase
                .from('endereco')
                .insert({ usuario_id: userId, cep, rua, numero, complemento, bairro, cidade, estado_endereco })
                .select()
                .single());
        }

        if (error) {
            console.error('Erro ao salvar endereço:', error.message, error.details, error.code);
            alert('Erro ao salvar endereço: ' + error.message + ' (Código: ' + error.code + ')');
            return;
        }

        console.log('Endereço salvo com sucesso:', result);
        alert('Endereço salvo com sucesso!');
        carregarEndereco(); // Recarrega os dados após salvar
    } catch (err) {
        console.error('Erro inesperado ao salvar endereço:', err.message, err.stack);
        alert('Erro inesperado ao salvar endereço: ' + err.message);
    }
}

async function carregarEndereco() {
    console.log('Carregando endereço...');
    try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Erro ao obter sessão:', sessionError.message);
            alert('Erro ao verificar sessão. Tente novamente.');
            return;
        }
        if (!session.session) {
            console.log('Nenhuma sessão encontrada, redirecionando para login');
            window.location.href = 'login.html';
            return;
        }

        const userId = session.session.user.id;
        console.log('Usuário ID:', userId);
        const { data, error } = await supabase
            .from('endereco')
            .select('cep, rua, numero, complemento, bairro, cidade, estado_endereco')
            .eq('usuario_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Erro ao carregar endereço:', error.message);
            alert('Erro ao carregar endereço: ' + error.message);
            return;
        }

        if (data) {
            console.log('Endereço carregado:', data);
            document.getElementById('cep').value = data.cep || '';
            document.getElementById('rua').value = data.rua || '';
            document.getElementById('numero').value = data.numero || '';
            document.getElementById('complemento').value = data.complemento || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.cidade || '';
            document.getElementById('estado-endereco').value = data.estado_endereco || '';
        } else {
            console.log('Nenhum endereço encontrado para o usuário');
            document.getElementById('cep').value = '';
            document.getElementById('rua').value = '';
            document.getElementById('numero').value = '';
            document.getElementById('complemento').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
            document.getElementById('estado-endereco').value = '';
        }
    } catch (err) {
        console.error('Erro inesperado ao carregar endereço:', err.message, err.stack);
        alert('Erro ao carregar endereço: ' + err.message);
    }
}

// Feed principal
function inicializarFeed() {
    carregarPedidos();
    inicializarFiltros();
    inicializarPesquisa();
}

async function carregarPedidos() {
    const { data: pedidos, error } = await supabase
        .from('pedido')
        .select(`
            id,
            user_id,
            titulo,
            categoria,
            descricao,
            foto_url,
            status,
            created_at,
            endereco (cep, rua, numero, complemento, bairro, cidade, estado_endereco),
            auth.users (user_metadata)
        `)
        .eq('status', STATUS_PEDIDOS.DISPONIVEL)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar pedidos:', error);
        alert('Erro ao carregar feed: ' + error.message);
        return;
    }

    // Mapear dados para o formato esperado por renderizarFeed
    pedidosCache = pedidos.map(pedido => ({
        id: pedido.id,
        titulo: pedido.titulo,
        descricao: pedido.descricao,
        categoria: pedido.categoria,
        estado: pedido.endereco?.estado_endereco || pedido.auth_users?.user_metadata?.estado || 'N/A',
        status: pedido.status,
        usuario: pedido.auth_users?.user_metadata?.nome || 'Anônimo',
        data: pedido.created_at,
        media: { tipo: 'imagem', url: pedido.foto_url || 'https://placehold.co/400x600?text=Sem+Imagem' },
        endereco: pedido.endereco || {
            nome: pedido.auth_users?.user_metadata?.nome || 'Anônimo',
            rua: 'N/A',
            bairro: 'N/A',
            cidade: 'N/A',
            estado: 'N/A',
            cep: 'N/A'
        }
    }));

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

supabase.auth.onAuthStateChange(async (event, session) => {
    try {
        if (event === 'SIGNED_IN' && session) {
            const { data: userData, error } = await supabase.auth.getUser();
            if (error) throw error;
            usuarioLogado = {
                id: userData.user.id,
                nome: userData.user.user_metadata.nome || 'Usuário',
                email: userData.user.email,
                username: userData.user.user_metadata.username || '',
                estado: userData.user.user_metadata.estado || '',
                termos: true,
                bio: userData.user.user_metadata.bio || ''
            };
            localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));
            await supabase.auth.updateUser({ data: usuarioLogado });
            atualizarMenuLogado();
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = '/index.html';
            }
        } else if (event === 'SIGNED_OUT') {
            usuarioLogado = null;
            localStorage.removeItem('cavalodado_usuario');
            atualizarMenuLogado();
        }
    } catch (err) {
        showError('Erro ao processar autenticação: ' + err.message);
        console.error('Erro no onAuthStateChange:', err);
    }
});

// Login
// Função para exibir mensagens de erro
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    } else {
        console.error('Elemento #error-message não encontrado na página.');
        alert(message);
    }
}

// Função para limpar mensagens de erro
function clearError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

// Função para alternar visibilidade da senha
function toggleSenha(id) {
    const senhaInput = document.getElementById(id);
    const tipo = senhaInput.type === 'password' ? 'text' : 'password';
    senhaInput.type = tipo;
}

// Validação de senha
function validatePassword(senha, confirmarSenha) {
    if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (!/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) return 'A senha deve conter letras e números.';
    return null;
}

// Login
document.getElementById('login-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    clearError();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    console.log('Tentando login com:', { email, senha });

    supabase.auth.signInWithPassword({
        email,
        password: senha,
    }).then(({ data, error }) => {
        if (error) {
            console.error('Erro no login:', error);
            const errorMessage = error.message.includes('Invalid login credentials') ? 'E-mail ou senha incorretos.' : 'Erro ao fazer login: ' + error.message;
            showError(errorMessage);
            return;
        }

        const usuario = {
            id: data.user.id,
            nome: data.user.user_metadata.nome || 'Usuário',
            email: data.user.email,
            username: data.user.user_metadata.username || 'usuário',
            estado: data.user.user_metadata.estado || ''
        };

        localStorage.setItem('cavalodado_token', data.session.access_token);
        localStorage.setItem('cavalodado_usuario', JSON.stringify(usuario));
        usuarioLogado = usuario;
        console.log('Usuário logado:', usuario);
        alert('Login realizado com sucesso!');
        window.location.href = 'index.html';
    }).catch(err => {
        console.error('Erro inesperado no login:', err);
        showError('Ocorreu um erro inesperado. Tente novamente.');
    });
});

// Registro
document.getElementById('register-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    clearError();

    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        estado: document.getElementById('estado').value,
        senha: document.getElementById('senha').value,
        confirmarSenha: document.getElementById('confirmar-senha').value,
        termos: document.getElementById('termos').checked
    };

    console.log('Tentando cadastro com:', dados);

    if (!dados.termos) {
        showError('Você deve aceitar os termos e condições.');
        return;
    }

    const passwordError = validatePassword(dados.senha, dados.confirmarSenha);
    if (passwordError) {
        showError(passwordError);
        return;
    }

 supabase.auth.signUp({
        email: dados.email,
        password: dados.senha,
        options: {
            data: {
                nome: dados.nome,
                username: dados.username,
                estado: dados.estado,
            },
        },
    }).then(({ data, error }) => {
        if (error) {
            console.error('Erro no cadastro:', error);
            showError('Erro ao cadastrar: ' + error.message);
            return;
        }

        const usuario = {
            id: data.user.id,
            nome: dados.nome,
            email: dados.email,
            username: dados.username,
            estado: dados.estado
        };

        localStorage.setItem('cavalodado_token', data.session.access_token);
        localStorage.setItem('cavalodado_usuario', JSON.stringify(usuario));
        usuarioLogado = usuario;
        console.log('Usuário cadastrado:', usuario);
        alert('Cadastro realizado com sucesso!');
        window.location.href = 'index.html';
    }).catch(err => {
        console.error('Erro inesperado no cadastro:', err);
        showError('Ocorreu um erro inesperado. Tente novamente.');
    });
});

// Redefinir senha
function resetPassword() {
    const email = document.getElementById('email').value;
    if (!email) {
        showError('Por favor, insira seu e-mail.');
        return;
    }
    supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://cavalodado.vercel.app/forgot-password.html',
    }).then(({ error }) => {
        if (error) {
            showError('Erro ao enviar e-mail de redefinição: ' + error.message);
            return;
        }
        alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
        window.location.href = 'login.html';
    }).catch(err => {
        showError('Ocorreu um erro inesperado. Tente novamente.');
        console.error('Erro no reset de senha:', err);
    });
}

// Listener para o formulário de recuperação de senha
document.getElementById('forgot-password-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    clearError();
    resetPassword();
});

// Listener para o formulário de redefinição de senha
document.getElementById('forgot-password-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    clearError();

    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;

    if (senha !== confirmarSenha) {
        showError('As senhas não coincidem.');
        return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(senha)) {
        showError('A senha deve ter no mínimo 6 caracteres, com letras e números.');
        return;
    }

    supabase.auth.updateUser({ password: senha }).then(({ data, error }) => {
        if (error) {
            showError('Erro ao redefinir a senha: ' + error.message);
            return;
        }
        alert('Senha redefinida com sucesso! Faça login com a nova senha.');
        window.location.href = 'login.html';
    }).catch(err => {
        showError('Ocorreu um erro inesperado. Tente novamente.');
        console.error('Erro ao redefinir senha:', err);
    });
});

// Logout
async function logout() {
    console.log('Tentando logout...');
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error.message);
        alert('Erro ao sair. Tente novamente.');
        return;
    }
    console.log('Logout bem-sucedido!');
    localStorage.removeItem('cavalodado_token');
    localStorage.removeItem('cavalodado_usuario');
    usuarioLogado = null;
    alert('Logout realizado com sucesso!');
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

    // Criar Pedido
async function criarPedido(e) {
    e.preventDefault();
    
    if (!usuarioLogado) {
        alert('Faça login para criar pedidos');
        return;
    }
    
    // Cooldown: checar último pedido no Supabase
    const { data: ultimoPedido, error: checkError } = await supabase
        .from('pedido')
        .select('created_at')
        .eq('user_id', usuarioLogado.id)
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (checkError) {
        alert('Erro ao verificar limite: ' + checkError.message);
        return;
    }
    
    if (ultimoPedido && ultimoPedido.length > 0) {
        const agora = new Date().getTime();
        const ultimo = new Date(ultimoPedido[0].created_at).getTime();
        const diferencaHoras = (agora - ultimo) / (1000 * 60 * 60);
        
        if (diferencaHoras < CONFIG.INTERVALO_PEDIDOS_HORAS) {
            alert(`Aguarde ${CONFIG.INTERVALO_PEDIDOS_HORAS} horas para novo pedido.`);
            return;
        }
    }
    
    // Coletar dados do form
    const titulo = document.getElementById('titulo').value.trim();
    const categoria = document.getElementById('categoria').value;
    const descricao = document.getElementById('descricao').value.trim();
    const fotoInput = document.getElementById('foto-input').files[0];
    const termos = document.getElementById('aceito-termos').checked;
    
    // Validações
    if (!titulo || !categoria || !descricao || !fotoInput || !termos) {
        alert('Preencha todos os campos obrigatórios e aceite os termos.');
        return;
    }
    if (titulo.length > CONFIG.MAX_CARACTERES_PRODUTO) {
        alert('Título excede 60 caracteres.');
        return;
    }
    if (!['image/png', 'image/jpeg'].includes(fotoInput.type)) {
        alert('Apenas PNG ou JPEG são permitidos.');
        return;
    }
    if (fotoInput.size > 5 * 1024 * 1024) {
        alert('Foto deve ter no máximo 5MB.');
        return;
    }
    
    // Upload foto para Storage
    const safeFileName = fotoInput.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${usuarioLogado.id}/${Date.now()}_${safeFileName}`;
    const { error: uploadError } = await supabase.storage
        .from('pedidos')
        .upload(fileName, fotoInput, { upsert: false });
    
if (uploadError) {
    console.error('Detalhes do erro de upload:', uploadError);
    alert('Erro ao fazer upload da foto: ' + uploadError.message);
    return;
}
    
    const fotoUrl = `${SUPABASE_URL}/storage/v1/object/public/pedidos/${fileName}`;
    
    // Inserir pedido no Supabase
    const { error } = await supabase
        .from('pedido')
        .insert({
            user_id: usuarioLogado.id,
            titulo,
            categoria,
            descricao,
            foto_url: fotoUrl,
            termos_pedido: termos,
            status: STATUS_PEDIDOS.DISPONIVEL
        });
    
    if (error) {
        alert('Erro ao criar pedido: ' + error.message);
        return;
    }
    
    alert('Pedido criado! Aguarde 2 horas para o próximo.');
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
                <p>@${usuarioLogado.username}</p>
                <p>${usuarioLogado.estado}</p>
                <p>${usuarioLogado.bio}</p>
                <a href="config.html" class="btn btn-primary">Editar Perfil</a>
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

function mostrarHistorico() {
    const content = document.getElementById('dashboard-content');
    if (content) {
        content.innerHTML = `
            <h2>Meu Histórico</h2>
            <div class="card">
                <table class="historico-table">
                    <thead><tr><th>Nome Pedido</th><th>Categoria</th><th>Data</th><th>Status</th><th></th></tr></thead>
                    <tbody id="historico-body"></tbody>
                </table>
            </div>
        `;
        carregarHistorico();
    }
}

// Histórico Tabela
async function carregarHistorico() {
    if (!usuarioLogado) {
        alert('Faça login para ver o histórico');
        window.location.href = 'login.html';
        return;
    }

    const { data: pedidos, error } = await supabase
        .from('pedido')
        .select('*')
        .eq('user_id', usuarioLogado.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar histórico:', error);
        alert('Erro ao carregar histórico: ' + error.message);
        return;
    }

    const tbody = document.getElementById('historico-body');
    if (!tbody) return;

    tbody.innerHTML = ''; // Limpar tabela antes de renderizar

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
        // Adicionar foto no expand
        const fotoHtml = pedido.foto_url ? `<img src="${pedido.foto_url}" alt="Foto do pedido" style="max-width: 200px; margin-bottom: 10px;">` : '';
        
        if (pedido.status === STATUS_PEDIDOS.DISPONIVEL) {
            expandContent.innerHTML = `
                ${fotoHtml}
                <button class="delete-btn">Excluir</button>
            `;
            expandContent.querySelector('.delete-btn').onclick = async () => {
                if (confirm('Exclusão permanente. Confirmar?')) {
                    const { error } = await supabase
                        .from('pedido')
                        .delete()
                        .eq('id', pedido.id);
                    if (error) {
                        alert('Erro ao excluir: ' + error.message);
                        return;
                    }
                    carregarHistorico();
                }
            };
        } else if (pedido.status === STATUS_PEDIDOS.PENDENTE) {
            expandContent.innerHTML = `
                ${fotoHtml}
                <div><input value="${pedido.codigo_rastreio || ''}" readonly><button class="copy-btn">Copiar</button></div>
                <div>
                    <label><input type="checkbox" name="opt" value="invalido">Código Inválido</label>
                    <label><input type="checkbox" name="opt" value="entregue">Produto Entregue</label>
                </div>
                <p class="note">Conferir o código com atenção.</p>
                <button class="confirm-btn">Confirmar</button>
            `;
            const [invalido, entregue] = expandContent.querySelectorAll('input[name="opt"]');
            const confirmBtn = expandContent.querySelector('.confirm-btn');
            expandContent.querySelector('.copy-btn').onclick = () => navigator.clipboard.writeText(pedido.codigo_rastreio || '');
            [invalido, entregue].forEach(cb => cb.onchange = () => {
                if (cb.checked) [invalido, entregue].forEach(other => other !== cb && (other.checked = false));
            });
            confirmBtn.onclick = async () => {
                const checked = expandContent.querySelector('input[name="opt"]:checked');
                if (!checked) return alert('Selecione uma opção');
                const updates = { status: checked.value === 'invalido' ? STATUS_PEDIDOS.DISPONIVEL : STATUS_PEDIDOS.CONCLUIDO };
                if (updates.status === STATUS_PEDIDOS.CONCLUIDO) updates.completion_date = new Date().toISOString();
                const { error } = await supabase
                    .from('pedido')
                    .update(updates)
                    .eq('id', pedido.id);
                if (error) {
                    alert('Erro ao atualizar status: ' + error.message);
                    return;
                }
                carregarHistorico();
            };
        } else if (pedido.status === STATUS_PEDIDOS.CONCLUIDO) {
            expandContent.innerHTML = `
                ${fotoHtml}
                <p>Finalizado em: ${new Date(pedido.completion_date).toLocaleDateString('pt-BR')}</p>
            `;
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
}

// Função preencherDadosUsuario
function preencherDadosUsuario() {
    if (!usuarioLogado) {
        console.error('Erro: usuarioLogado não definido.');
        showError('Nenhum usuário logado.');
        return;
    }
    console.log('Preenchendo dados do usuário:', usuarioLogado);
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const bioInput = document.getElementById('bio');
    const estadoInput = document.getElementById('estado-endereco');
    if (nomeInput) nomeInput.value = usuarioLogado.nome || '';
    if (emailInput) emailInput.value = usuarioLogado.email || '';
    if (usernameInput) usernameInput.value = usuarioLogado.username || '';
    if (bioInput) bioInput.value = usuarioLogado.bio || '';
    if (estadoInput) estadoInput.value = usuarioLogado.estado || '';
}

// Verificar usuário logado ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página carregada. Verificando usuário logado...');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.error('Nenhum usuário logado:', error);
        return;
    }
    console.log('Usuário logado encontrado:', user);
    // Buscar dados na tabela 'usuario'
    const { data, error: dbError } = await supabase
        .from('usuario')
        .select('nome, email, username, bio, estado')
        .eq('id', user.id)
        .single();
    if (dbError) {
        console.error('Erro ao buscar dados do usuário:', dbError);
        return;
    }
    window.usuarioLogado = data || {
        nome: user.user_metadata.full_name || '',
        email: user.email || '',
        username: '',
        bio: '',
        estado: ''
    };
    console.log('Dados do usuário carregados:', window.usuarioLogado);
    preencherDadosUsuario();
});

// Encaminhar Pedido para Perfil 
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('pedido-titulo')) {
        const pedidoId = e.target.closest('.pedido-item').dataset.id;
        window.location.href = `dashboard.html?id=${pedidoId}`;
    }
});
