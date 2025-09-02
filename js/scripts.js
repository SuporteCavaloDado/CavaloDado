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
            <a href="dashboard.html" class="menu-item">Histórico</a>
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
                    nome: data.user.user_metadata.nome || 'Usuário',  
                    email: data.user.email,
                    username: data.user.user_metadata.username || '',
                    estado: data.user.user_metadata.estado || '',
                    termos: data.user.user_metadata.termos || true,  
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
        if (errorMessage) errorMessage.innerHTML = '<p>Complete seu perfil (usuário e endereço).</p>';
    }

    // Exibir foto de perfil
    const profileImg = document.getElementById('profile-img');
    if (profileImg) {
        profileImg.src = usuarioLogado.photo_url || 'https://placehold.co/100x100?text=Perfil';
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

            // Upload de foto com validação
            const fileInput = document.getElementById('profile-photo');
            if (fileInput?.files?.[0]) {
                const file = fileInput.files[0];
                // Validar tipo de arquivo (apenas imagens)
                if (!file.type.startsWith('image/')) {
                    showError('Por favor, selecione uma imagem válida (ex: JPEG, PNG).');
                    return;
                }
                // Validar tamanho (máximo 5MB para evitar erros)
                if (file.size > 5 * 1024 * 1024) {
                    showError('A imagem deve ter no máximo 5MB.');
                    return;
                }
                const fileExt = file.name.split('.').pop().toLowerCase();
                const filePath = `${usuarioLogado.id}/profile.${fileExt}`;
                try {
                    const { error: uploadError } = await supabase.storage
                        .from('usuario')
                        .upload(filePath, file, { upsert: true });
                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage
                        .from('usuario')
                        .getPublicUrl(filePath);
                    dados.photo_url = urlData.publicUrl;
                } catch (error) {
                    showError('Erro ao fazer upload da foto: ' + error.message);
                    return;
                }
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
    formatViews();
}

function formatViews(views) {
    if (views >= 1000000) {
        return `${Math.round(views / 100000) / 10}M`; // Ex: 1.2M
    } else if (views >= 1000) {
        return `${Math.round(views / 1000)}MIL`; // Ex: 5MIL
    }
    return `${views}`; // Ex: 5
}

async function carregarPedidos() {
    // Buscar pedidos sem join automático
    const { data: pedidos, error: pedidoError } = await supabase
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
            user_nome,
            user_estado,
            views,
            endereco_id
        `)
        .in('status', ['Disponível', 'Pendente', 'Concluído'])
        .order('created_at', { ascending: false });

    if (pedidoError) {
        console.error('Erro ao carregar pedidos:', pedidoError);
        alert('Erro ao carregar feed: ' + pedidoError.message);
        return;
    }

    // Buscar usernames de public.usuario
    const userIds = [...new Set(pedidos.map(p => p.user_id))];
    const { data: usuarios, error: userError } = await supabase
        .from('usuario')
        .select('id, username')
        .in('id', userIds);

    if (userError) {
        console.error('Erro ao carregar usernames:', userError);
        alert('Erro ao carregar usernames: ' + userError.message);
        return;
    }
    const usernameMap = new Map(usuarios.map(u => [u.id, u.username || 'anonimo']));

    // Buscar endereços apenas para pedidos com endereco_id
    const enderecoIds = [...new Set(pedidos.filter(p => p.endereco_id).map(p => p.endereco_id))];
    let enderecoMap = new Map();
    if (enderecoIds.length > 0) {
        const { data: enderecos, error: enderecoError } = await supabase
            .from('endereco')
            .select('id, cep, rua, numero, complemento, bairro, cidade, estado_endereco')
            .in('id', enderecoIds);
        if (enderecoError) {
            console.error('Erro ao carregar endereços:', enderecoError);
        } else {
            enderecoMap = new Map(enderecos.map(e => [e.id, e]));
        }
    }

    // Incrementar views em lote
    const pedidoIds = pedidos.map(p => p.id);
    if (pedidoIds.length > 0) {
        const { error: incrementError } = await supabase.rpc('increment_pedido_views', { pedido_ids: pedidoIds });
        if (incrementError) console.error('Erro ao incrementar views:', incrementError);
    }

    pedidosCache = pedidos.map(pedido => ({
        id: pedido.id,
        titulo: pedido.titulo,
        descricao: pedido.descricao,
        categoria: pedido.categoria,
        estado: pedido.user_estado || enderecoMap.get(pedido.endereco_id)?.estado_endereco || 'N/A',
        status: pedido.status,
        usuario: pedido.user_nome || 'Anônimo',
        username: usernameMap.get(pedido.user_id) || 'anonimo',
        data: pedido.created_at,
        views: pedido.views || 0,
        media: { tipo: 'imagem', url: pedido.foto_url || 'https://placehold.co/400x600?text=Sem+Imagem' },
        endereco: enderecoMap.get(pedido.endereco_id) || {
            nome: pedido.user_nome || 'Anônimo',
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
        console.log('Carregando pedido no feed:', {
            titulo: pedido.titulo,
            fotoUrl: pedido.media.url
        });
        
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
            <button class="action-btn btn-doar" onclick="abrirModalDoacao('${pedido.id}')">
                <span>❤️</span>
            </button>
        </div>
        <div class="pedido-info">
            <div class="pedido-titulo">${pedido.titulo}</div>
            <div class="pedido-descricao">${pedido.descricao}</div>
            <div class="pedido-meta">
                <span>${pedido.categoria}</span>
                <span>${pedido.estado}</span>
                <span>${pedido.status}</span>
                <span>${formatViews(pedido.views)}</span>
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
async function abrirModalDoacao(pedidoId) {
    let pedidoData;
    try {
        const { data, error } = await supabase
            .from('pedido')
            .select('id, titulo, user_id, user_nome, endereco_id')
            .eq('id', pedidoId)
            .single();
        if (error || !data) throw error;
        pedidoData = data;
        console.log('Dados do pedido:', pedidoData);
    } catch (err) {
        console.error('Erro ao carregar pedido:', err);
        alert('Erro ao carregar dados do pedido.');
        pedidoData = pedidosCache.find(p => p.id === pedidoId);
        if (!pedidoData) return;
    }

    if (typeof usuarioLogado === 'undefined' || !usuarioLogado) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            usuarioLogado = user;
        } catch (authErr) {
            console.error('Erro ao carregar usuário logado:', authErr);
            usuarioLogado = null;
        }
    }

    if (usuarioLogado && pedidoData.user_id === usuarioLogado.id) {
        alert('Você não pode doar para seu próprio pedido.');
        return;
    }

    // Buscar dados do perfil do criador (nome, bio, estado, photo_url)
let perfilData = { nome: 'Anônimo', bio: '', estado: 'N/A', photo_url: 'https://placehold.co/100x100?text=Perfil' };
try {
    // Buscar dados do usuário na tabela usuario
    const { data: usuario, error: userError } = await supabase
        .from('usuario')
        .select('id, nome, bio, estado, photo_url')
        .eq('id', pedidoData.user_id)
        .single();
    if (!userError && usuario) {
        perfilData.nome = usuario.nome || 'Anônimo';
        perfilData.bio = usuario.bio || '';
        perfilData.estado = usuario.estado || 'N/A';
        perfilData.photo_url = usuario.photo_url || perfilData.photo_url;
    } else {
        console.warn('Usuário não encontrado na tabela usuario:', userError);
    }

    // Buscar user_metadata do Supabase Auth para o usuário logado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError && user && user.id === pedidoData.user_id) {
        perfilData.nome = usuarioLogado.nome || perfilData.nome;
        perfilData.bio = usuarioLogado.bio || perfilData.bio;
        perfilData.estado = usuarioLogado.estado || perfilData.estado;
        perfilData.photo_url = usuarioLogado.photo_url || perfilData.photo_url;
    }

    // Buscar photo_url diretamente no storage como fallback
    if (!perfilData.photo_url || perfilData.photo_url === 'https://placehold.co/100x100?text=Perfil') {
        const filePath = `${pedidoData.user_id}/profile.jpg`; // Ajuste a extensão se necessário
        const { data: urlData } = supabase.storage
            .from('usuario')
            .getPublicUrl(filePath);
        if (urlData?.publicUrl) {
            perfilData.photo_url = urlData.publicUrl;
        }
    }

    console.log('Dados do perfil carregados:', perfilData);
} catch (perfilErr) {
    console.error('Erro ao carregar perfil do criador:', perfilErr);
    alert('Erro ao carregar informações do criador.');
}

    // Buscar endereço (mantido como antes)
    let enderecoData = null;
    let nomeUsuario = pedidoData.user_nome || perfilData.nome;
    let estadoFallback = perfilData.estado;

    if (pedidoData.endereco_id) {
        try {
            const { data: addrData, error: addrError } = await supabase
                .from('endereco')
                .select('id, cep, rua, numero, complemento, bairro, cidade, estado_endereco')
                .eq('id', pedidoData.endereco_id)
                .maybeSingle();
            if (!addrError && addrData) {
                enderecoData = addrData;
                console.log('Endereço via endereco_id:', enderecoData);
            } else {
                console.warn('Nenhum endereço encontrado via endereco_id:', addrError);
            }
        } catch (addrErr) {
            console.error('Erro ao consultar endereço via endereco_id:', addrErr);
        }
    }

    if (!enderecoData) {
        try {
            const { data: addrData, error: addrError } = await supabase
                .from('endereco')
                .select('id, cep, rua, numero, complemento, bairro, cidade, estado_endereco')
                .eq('usuario_id', pedidoData.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (!addrError && addrData) {
                enderecoData = addrData;
                console.log('Endereço via usuario_id:', enderecoData);
                if (!pedidoData.endereco_id && addrData.id) {
                    try {
                        const { error: updateError } = await supabase
                            .from('pedido')
                            .update({ endereco_id: addrData.id })
                            .eq('id', pedidoId);
                        if (updateError) throw updateError;
                        console.log('Endereço vinculado ao pedido com sucesso.');
                    } catch (updateErr) {
                        console.error('Erro ao vincular endereço:', updateErr);
                    }
                }
            } else {
                console.error('Nenhum endereço encontrado via usuario_id:', addrError);
                alert('O criador do pedido não possui endereço cadastrado. Peça para cadastrar em Configurações.');
            }
        } catch (addrErr) {
            console.error('Erro ao consultar endereço via usuario_id:', addrErr);
            alert('Erro ao consultar endereço. Verifique as permissões do banco.');
        }
    }

    if (!nomeUsuario || !enderecoData) {
        try {
            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('nome, estado')
                .eq('id', pedidoData.user_id)
                .single();
            if (!usuarioError && usuarioData) {
                nomeUsuario = nomeUsuario || usuarioData.nome;
                estadoFallback = usuarioData.estado || 'N/A';
                console.log('Dados do usuário:', usuarioData);
            }
        } catch (usuarioErr) {
            console.error('Erro ao carregar dados do usuário:', usuarioErr);
        }
    }

    const endereco = enderecoData ? {
        nome: nomeUsuario,
        cep: enderecoData.cep,
        rua: enderecoData.rua,
        numero: enderecoData.numero,
        complemento: enderecoData.complemento || '',
        bairro: enderecoData.bairro,
        cidade: enderecoData.cidade,
        estado_endereco: enderecoData.estado_endereco || estadoFallback
    } : {
        nome: nomeUsuario,
        cep: 'N/A',
        rua: 'N/A',
        numero: 'N/A',
        complemento: '',
        bairro: 'N/A',
        cidade: 'N/A',
        estado_endereco: estadoFallback
    };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Doar para: ${pedidoData.titulo}</h3>
                <button class="modal-close" onclick="fecharModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="perfil-criador">
                    <img src="${perfilData.photo_url}" alt="Foto do criador" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
                    <p><strong>Nome:</strong> ${perfilData.nome}</p>
                    <p><strong>Bio:</strong> ${perfilData.bio}</p>
                    <p><strong>Estado:</strong> ${perfilData.estado}</p>
                </div>
                <div class="endereco-completo">
                    <h4>Endereço de entrega:</h4>
                    <div class="endereco-linha">
                        <span>${endereco.nome}</span>
                        <button onclick="copiarTexto('${endereco.nome}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${endereco.rua}</span>
                        <button onclick="copiarTexto('${endereco.rua}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${endereco.numero}${endereco.complemento ? ' - ' + endereco.complemento : ''}</span>
                        <button onclick="copiarTexto('${endereco.numero}${endereco.complemento ? ' - ' + endereco.complemento : ''}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${endereco.bairro}</span>
                        <button onclick="copiarTexto('${endereco.bairro}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${endereco.cidade} - ${endereco.estado_endereco}</span>
                        <button onclick="copiarTexto('${endereco.cidade} - ${endereco.estado_endereco}')">Copiar</button>
                    </div>
                    <div class="endereco-linha">
                        <span>${endereco.cep}</span>
                        <button onclick="copiarTexto('${endereco.cep}')">Copiar</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Código de rastreio *</label>
                    <input type="text" id="codigo-rastreio" class="form-input" 
                           placeholder="Digite o código de rastreio (exatamente 13 caracteres)" 
                           maxlength="13" minlength="13" required>
                </div>
                
                <div class="form-checkbox">
                    <input type="checkbox" id="aceito-responsabilidade" required>
                    <label for="aceito-responsabilidade">
                        Concordo com as responsabilidades da doação
                    </label>
                </div>
                
                <button class="btn btn-primary" onclick="confirmarDoacao('${pedidoId}')">
                    Confirmar Doação
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Confirmar Doação
async function confirmarDoacao(pedidoId) {
    console.log('Iniciando confirmarDoacao para pedido:', pedidoId);
    const codigoRastreio = document.getElementById('codigo-rastreio').value;
    const termosAceitos = document.getElementById('aceito-responsabilidade').checked;

    if (!codigoRastreio || codigoRastreio.length !== 13) {
        console.error('Código inválido:', codigoRastreio);
        alert('O código de rastreio deve ter 13 caracteres.');
        return;
    }
    if (!termosAceitos) {
        console.error('Termos não aceitos');
        alert('Aceite as responsabilidades da doação.');
        return;
    }

    try {
        // Verificar doação existente
        const { data: existingDoacao, error: checkError } = await supabase
            .from('doacao')
            .select('id, codigo_rastreio')
            .eq('pedido_id', pedidoId)
            .single();
        if (existingDoacao) {
            console.warn('Doação existente:', existingDoacao);
            alert(`Este pedido já tem uma doação com código ${existingDoacao.codigo_rastreio}.`);
            return;
        }
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Erro ao verificar doação:', checkError);
            throw checkError;
        }

        // Inserir doação
        const doacaoData = {
            pedido_id: pedidoId,
            doador_id: (await supabase.auth.getUser()).data.user?.id || null,
            codigo_rastreio: codigoRastreio,
            termos_doacao: termosAceitos
        };
        const { data: doacao, error: doacaoError } = await supabase
            .from('doacao')
            .insert([doacaoData])
            .select()
            .single();
        if (doacaoError) {
            console.error('Erro ao inserir doação:', doacaoError);
            throw doacaoError;
        }

        // Atualizar status do pedido
        const { error: updateError } = await supabase
            .from('pedido')
            .update({ status: 'Pendente' })
            .eq('id', pedidoId);
        if (updateError) {
            console.error('Erro ao atualizar status:', updateError);
            throw updateError;
        }

        console.log('Doação salva:', doacao);
        alert('Doação confirmada! Código: ' + codigoRastreio);
        fecharModal();
    } catch (err) {
        console.error('Erro ao confirmar doação:', err);
        alert('Erro ao confirmar doação: ' + err.message);
    }
}

// Copiar Texto
function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert('Texto copiado!');
    });
}

function fecharModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
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
    const termos = document.getElementById('termos-pedido').checked;
    
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
        console.error('Erro no upload:', {
            bucket: 'pedidos',
            fileName,
            errorDetails: uploadError
        });
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
        status: STATUS_PEDIDOS.DISPONIVEL,
        user_nome: usuarioLogado.nome || 'Anônimo',  
        user_estado: usuarioLogado.estado || 'N/A'  
    });
    
    if (error) {
        alert('Erro ao criar pedido: ' + error.message);
        return;
    }
    
    alert('Pedido criado! Aguarde 2 horas para o próximo.');
    window.location.href = 'index.html';
}

// Dashboard
async function inicializarDashboard() {
    const content = document.getElementById('dashboard-content');
    const menuItems = document.getElementById('menu-items');
    if (!content || !menuItems) {
        console.error('Erro: dashboard-content ou menu-items não encontrado');
        content && (content.innerHTML = '<p>Erro: Elementos da página não encontrados.</p>');
        return;
    }

    // Verificar usuário logado
    if (!usuarioLogado) {
        content.innerHTML = '<p>Faça login para ver o histórico.</p>';
        window.location.href = 'login.html';
        return;
    }

    // Configurar menu lateral (sem Perfil ou Favoritos)
    menuItems.innerHTML = `
        <a href="/index.html" class="menu-item">Início</a>
        <a href="/new-request.html" class="menu-item">Novo Pedido</a>
        <a href="/dashboard.html" class="menu-item">Histórico</a>
        <a href="/config.html" class="menu-item">Configurações</a>
        <a href="/regras.html" class="menu-item">Termos e Regras</a>
        <a href="#" class="menu-item" onclick="logout()">Sair</a>
    `;

    // Carregar histórico diretamente
    content.innerHTML = `
        <h2>Meu Histórico</h2>
        <div class="card">
            <table class="historico-table">
                <thead><tr><th>Nome do Pedido</th><th>Categoria</th><th>Status</th><th></th></tr></thead>
                <tbody id="historico-body"></tbody>
            </table>
        </div>
    `;
    await carregarHistorico();
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
        .select('id, titulo, categoria, status, doacao!left(codigo_rastreio)')
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
            <td>${pedido.titulo}</td>
            <td>${pedido.categoria}</td>
            <td>${pedido.status}</td>
            <td><span class="expand-btn">▼</span></td>
        `;
        const expandRow = document.createElement('tr');
        expandRow.innerHTML = `<td colspan="4"><div class="expand-content"></div></td>`;
        tbody.appendChild(row);
        tbody.appendChild(expandRow);

        const expandContent = expandRow.querySelector('.expand-content');
        if (pedido.status === STATUS_PEDIDOS.DISPONIVEL) {
            expandContent.innerHTML = `
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
                <div><input value="${pedido.doacao?.codigo_rastreio || ''}" readonly><button class="copy-btn">Copiar</button></div>
                <div>
                    <label><input type="checkbox" name="opt" value="invalido">Código Inválido</label>
                    <label><input type="checkbox" name="opt" value="entregue">Produto Entregue</label>
                </div>
                <p class="note">Conferir o código com atenção.</p>
                <button class="confirm-btn">Confirmar</button>
            `;
            const [invalido, entregue] = expandContent.querySelectorAll('input[name="opt"]');
            const confirmBtn = expandContent.querySelector('.confirm-btn');
            expandContent.querySelector('.copy-btn').onclick = () => {
                const codigo = pedido.doacao?.codigo_rastreio || '';
                if (codigo) {
                    navigator.clipboard.writeText(codigo);
                    alert('Código copiado!');
                } else {
                    alert('Nenhum código de rastreio disponível.');
                }
            };
            [invalido, entregue].forEach(cb => {
                cb.onchange = () => {
                    if (cb.checked) [invalido, entregue].forEach(other => other !== cb && (other.checked = false));
                };
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
                <p>Código de Rastreio: ${pedido.doacao?.codigo_rastreio || 'N/A'}</p>
            `;
        }

        row.querySelector('.expand-btn').onclick = (e) => {
            expandContent.style.display = expandContent.style.display === 'block' ? 'none' : 'block';
            e.target.textContent = expandContent.style.display === 'block' ? '▲' : '▼';
        };
    });
}

// Função preencherDadosUsuario
async function preencherDadosUsuario() {
    if (!usuarioLogado) {
        console.error('Erro: usuarioLogado não definido.');
        showError('Nenhum usuário logado.');
        return;
    }
    console.log('Sincronizando dados do perfil com Supabase...');
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('Usuário não encontrado no Supabase.');

        // Atualiza usuarioLogado com user_metadata
        usuarioLogado = {
            ...usuarioLogado,
            id: user.id,
            nome: user.user_metadata.nome || usuarioLogado.nome || 'Usuário',
            email: user.email || usuarioLogado.email || '',
            username: user.user_metadata.username || usuarioLogado.username || '',
            bio: user.user_metadata.bio || '', // Garantir bio
            termos: user.user_metadata.termos || true
            // Nota: Removido 'estado' pois vem da tabela 'endereco', não user_metadata
        };
        localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));

        // Preenche formulário com verificação de null
        const nomeInput = document.getElementById('nome');
        const emailInput = document.getElementById('email');
        const usernameInput = document.getElementById('username');
        const bioInput = document.getElementById('bio');

        if (nomeInput) nomeInput.value = usuarioLogado.nome || '';
        if (emailInput) emailInput.value = usuarioLogado.email || '';
        if (usernameInput) usernameInput.value = usuarioLogado.username || '';
        if (bioInput) bioInput.value = usuarioLogado.bio || '';

        console.log('Perfil sincronizado com sucesso, incluindo bio:', usuarioLogado.bio);
    } catch (err) {
        console.error('Erro ao sincronizar perfil:', err);
        showError('Falha ao carregar bio e perfil. Tente recarregar.');
    }
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
