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
                        bio: userData.user.user_metadata.bio || '',
                        photo_url: userData.user.user_metadata.photo_url || 'https://placehold.co/100x100?text=Perfil'
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

// Login
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
                    bio: data.user.user_metadata.bio || '',
                    photo_url: data.user.user_metadata.photo_url || 'https://placehold.co/100x100?text=Perfil'
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

// Registro
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

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
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

            if (!dados.termos) {
                showError('Você deve aceitar os termos e condições.');
                return;
            }

            const passwordError = validatePassword(dados.senha, dados.confirmarSenha);
            if (passwordError) {
                showError(passwordError);
                return;
            }

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: dados.email,
                    password: dados.senha,
                    options: {
                        data: {
                            nome: dados.nome,
                            username: dados.username,
                            estado: dados.estado,
                            termos: true
                        }
                    }
                });
                if (error) throw error;

                await supabase.from('usuario').insert({
                    id: data.user.id,
                    nome: dados.nome,
                    email: dados.email,
                    username: dados.username,
                    estado: dados.estado,
                    termos: true
                });

                usuarioLogado = {
                    id: data.user.id,
                    nome: dados.nome,
                    email: dados.email,
                    username: dados.username,
                    estado: dados.estado,
                    termos: true
                };
                localStorage.setItem('cavalodado_token', data.session.access_token);
                localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));
                alert('Cadastro realizado com sucesso!');
                window.location.href = 'index.html';
            } catch (error) {
                showError('Erro ao cadastrar: ' + error.message);
            }
        });
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
                if (!file.type.startsWith('image/')) {
                    showError('Por favor, selecione uma imagem válida (ex: JPEG, PNG).');
                    return;
                }
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
                await supabase.from('usuario').update({
                    nome: dados.nome,
                    username: dados.username,
                    bio: dados.bio,
                    photo_url: dados.photo_url
                }).eq('id', usuarioLogado.id);
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
        enderecoForm.addEventListener('submit', salvarEndereco);
    }
}

// Salvar Endereço
async function salvarEndereco(event) {
    event.preventDefault();
    try {
        const userId = usuarioLogado.id;
        const cep = document.getElementById('cep').value.trim();
        const rua = document.getElementById('rua').value.trim();
        const numero = document.getElementById('numero').value.trim();
        const complemento = document.getElementById('complemento').value.trim();
        const bairro = document.getElementById('bairro').value.trim();
        const cidade = document.getElementById('cidade').value.trim();
        const estado_endereco = document.getElementById('estado-endereco').value;

        if (!cep.match(/^\d{5}-\d{3}$/)) {
            alert('CEP inválido. Use o formato 00000-000.');
            return;
        }
        if (!rua || !numero || !bairro || !cidade || !estado_endereco) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }
        if (!ESTADOS_BRASIL.includes(estado_endereco)) {
            alert('Selecione um estado válido.');
            return;
        }

        let result, error;
        const { data: existingAddress, error: selectError } = await supabase
            .from('endereco')
            .select('id')
            .eq('usuario_id', userId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            alert('Erro ao verificar endereço: ' + selectError.message);
            return;
        }

        if (existingAddress) {
            ({ data: result, error } = await supabase
                .from('endereco')
                .update({ cep, rua, numero, complemento, bairro, cidade, estado_endereco, updated_at: new Date() })
                .eq('usuario_id', userId)
                .select()
                .single());
        } else {
            ({ data: result, error } = await supabase
                .from('endereco')
                .insert({ usuario_id: userId, cep, rua, numero, complemento, bairro, cidade, estado_endereco })
                .select()
                .single());
        }

        if (error) {
            alert('Erro ao salvar endereço: ' + error.message);
            return;
        }

        alert('Endereço salvo com sucesso!');
        carregarEndereco();
    } catch (err) {
        alert('Erro ao salvar endereço: ' + err.message);
    }
}

// Carregar Endereço
async function carregarEndereco() {
    try {
        const userId = usuarioLogado.id;
        const { data, error } = await supabase
            .from('endereco')
            .select('cep, rua, numero, complemento, bairro, cidade, estado_endereco')
            .eq('usuario_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            alert('Erro ao carregar endereço: ' + error.message);
            return;
        }

        if (data) {
            document.getElementById('cep').value = data.cep || '';
            document.getElementById('rua').value = data.rua || '';
            document.getElementById('numero').value = data.numero || '';
            document.getElementById('complemento').value = data.complemento || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.cidade || '';
            document.getElementById('estado-endereco').value = data.estado_endereco || '';
        } else {
            document.getElementById('cep').value = '';
            document.getElementById('rua').value = '';
            document.getElementById('numero').value = '';
            document.getElementById('complemento').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
            document.getElementById('estado-endereco').value = '';
        }
    } catch (err) {
        alert('Erro ao carregar endereço: ' + err.message);
    }
}

// Feed principal
function inicializarFeed() {
    carregarPedidos();
    inicializarFiltros();
    inicializarPesquisa();
}

function formatViews(views) {
    if (views >= 1000000) return `${Math.round(views / 100000) / 10}M`;
    if (views >= 1000) return `${Math.round(views / 1000)}MIL`;
    return `${views}`;
}

async function carregarPedidos() {
    try {
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
            .in('status', [STATUS_PEDIDOS.DISPONIVEL, STATUS_PEDIDOS.PENDENTE, STATUS_PEDIDOS.CONCLUIDO])
            .order('created_at', { ascending: false });

        if (pedidoError) {
            alert('Erro ao carregar feed: ' + pedidoError.message);
            return;
        }

        const userIds = [...new Set(pedidos.map(p => p.user_id).filter(id => id))];
        let usernameMap = new Map();
        if (userIds.length > 0) {
            const { data: usuarios, error: userError } = await supabase
                .from('usuario')
                .select('id, username')
                .in('id', userIds);
            if (userError) {
                alert('Erro ao carregar usernames: ' + userError.message);
                return;
            }
            usernameMap = new Map(usuarios.map(u => [u.id, u.username || 'anonimo']));
        }

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
                rua: 'N/A',
                bairro: 'N/A',
                cidade: 'N/A',
                estado: 'N/A',
                cep: 'N/A'
            }
        }));

        renderizarFeed(pedidosCache);
    } catch (err) {
        alert('Erro ao carregar pedidos: ' + err.message);
    }
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
    
    preencherFiltros();
}

function preencherFiltros() {
    const categoriaSelect = document.getElementById('filtro-categoria');
    const estadoSelect = document.getElementById('filtro-estado');
    
    if (categoriaSelect) {
        categoriaSelect.innerHTML = '<option value="">Todas as categorias</option>';
        CATEGORIAS.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaSelect.appendChild(option);
        });
    }
    
    if (estadoSelect) {
        estadoSelect.innerHTML = '<option value="">Todos os estados</option>';
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
    
    filtrosAtivos = { categoria, estado, status };
    
    let pedidosFiltrados = pedidosCache.filter(pedido => {
        if (categoria && pedido.categoria !== categoria) return false;
        if (estado && pedido.estado !== estado) return false;
        if (status && pedido.status !== status) return false;
        return true;
    });
    
    renderizarFeed(pedidosFiltrados);
}

function limparFiltros() {
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-status').value = '';
    
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
            .select('id, titulo, descricao, created_at, user_id, user_nome, endereco_id, foto_url')
            .eq('id', pedidoId)
            .single();
        if (error || !data) throw error;
        pedidoData = data;
    } catch (err) {
        alert('Erro ao carregar dados do pedido: ' + err.message);
        pedidoData = pedidosCache.find(p => p.id === pedidoId);
        if (!pedidoData) return;
    }

    if (usuarioLogado && pedidoData.user_id === usuarioLogado.id) {
        alert('Você não pode doar para seu próprio pedido.');
        return;
    }

    let perfilData = { nome: 'Anônimo', bio: '', username: 'anonimo', photo_url: 'https://placehold.co/100x100?text=Perfil' };
    try {
        const { data: usuario, error: userError } = await supabase
            .from('usuario')
            .select('nome, bio, username, photo_url')
            .eq('id', pedidoData.user_id)
            .single();
        if (!userError && usuario) {
            perfilData = {
                nome: usuario.nome || 'Anônimo',
                bio: usuario.bio || '',
                username: usuario.username || 'anonimo',
                photo_url: usuario.photo_url || 'https://placehold.co/100x100?text=Perfil'
            };
        }
    } catch (perfilErr) {
        console.error('Erro ao carregar perfil:', perfilErr);
    }

    let enderecoData = null;
    if (pedidoData.endereco_id) {
        try {
            const { data: addrData, error: addrError } = await supabase
                .from('endereco')
                .select('cep, rua, numero, complemento, bairro, cidade, estado_endereco')
                .eq('id', pedidoData.endereco_id)
                .single();
            if (!addrError && addrData) {
                enderecoData = addrData;
            }
        } catch (addrErr) {
            console.error('Erro ao consultar endereço:', addrErr);
        }
    }

    if (!enderecoData) {
        try {
            const { data: addrData, error: addrError } = await supabase
                .from('endereco')
                .select('cep, rua, numero, complemento, bairro, cidade, estado_endereco')
                .eq('usuario_id', pedidoData.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (!addrError && addrData) {
                enderecoData = addrData;
                if (!pedidoData.endereco_id) {
                    await supabase.from('pedido').update({ endereco_id: addrData.id }).eq('id', pedidoId);
                }
            }
        } catch (addrErr) {
            console.error('Erro ao consultar endereço:', addrErr);
            alert('O criador do pedido não possui endereço cadastrado.');
        }
    }

    const endereco = enderecoData ? {
        cep: enderecoData.cep,
        rua: enderecoData.rua,
        numero: enderecoData.numero,
        complemento: enderecoData.complemento || '',
        bairro: enderecoData.bairro,
        cidade: enderecoData.cidade,
        estado_endereco: enderecoData.estado_endereco
    } : {
        cep: 'N/A',
        rua: 'N/A',
        numero: 'N/A',
        complemento: '',
        bairro: 'N/A',
        cidade: 'N/A',
        estado_endereco: 'N/A'
    };

    const createdDate = new Date(pedidoData.created_at).toLocaleDateString('pt-BR');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${pedidoData.titulo}</h3>
                <button class="modal-close" onclick="fecharModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>${pedidoData.descricao}</p>
                <p>Criado em: ${createdDate}</p>
                <div class="pedido-media">
                    <img src="${pedidoData.foto_url || 'https://placehold.co/400x600?text=Sem+Imagem'}" alt="Imagem do pedido" class="pedido-image">
                </div>
                <div class="perfil-criador">
                    <img src="${perfilData.photo_url}" alt="Foto do criador" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
                    <p>${perfilData.username}</p>
                    <p>${perfilData.nome}</p>
                    <p>${perfilData.bio || 'Sem bio'}</p>
                </div>
                <div class="endereco-completo">
                    <h4>Endereço de entrega:</h4>
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
    const codigoRastreio = document.getElementById('codigo-rastreio').value;

    if (!codigoRastreio || codigoRastreio.length !== CONFIG.MIN_CODIGO_RASTREIO) {
        alert(`O código de rastreio deve ter ${CONFIG.MIN_CODIGO_RASTREIO} caracteres.`);
        return;
    }

    try {
        const { data: pedido, error: pedidoError } = await supabase
            .from('pedido')
            .select('status')
            .eq('id', pedidoId)
            .single();
        if (pedidoError) throw pedidoError;
        if (pedido.status === STATUS_PEDIDOS.CONCLUIDO) {
            alert('Este pedido já foi concluído e não aceita mais doações.');
            return;
        }

        const doacaoData = {
            pedido_id: pedidoId,
            doador_id: usuarioLogado?.id || null,
            codigo_rastreio: codigoRastreio,
            termos_doacao: true
        };
        const { data: doacao, error: doacaoError } = await supabase
            .from('doacao')
            .insert([doacaoData])
            .select()
            .single();
        if (doacaoError) throw doacaoError;

        if (pedido.status === STATUS_PEDIDOS.DISPONIVEL) {
            const { error: updateError } = await supabase
                .from('pedido')
                .update({ status: STATUS_PEDIDOS.PENDENTE })
                .eq('id', pedidoId);
            if (updateError) throw updateError;
        }

        alert('Doação confirmada! Código: ' + codigoRastreio);
        fecharModal();
    } catch (err) {
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

// Dashboard
async function inicializarDashboard() {
    if (!usuarioLogado) {
        window.location.href = 'login.html';
        return;
    }

    const content = document.getElementById('dashboard-content');
    const menuItems = document.getElementById('menu-items');
    if (!content || !menuItems) {
        content && (content.innerHTML = '<p>Erro: Elementos da página não encontrados.</p>');
        return;
    }

    menuItems.innerHTML = `
        <a href="/index.html" class="menu-item">Início</a>
        <a href="/new-request.html" class="menu-item">Novo Pedido</a>
        <a href="/dashboard.html" class="menu-item">Histórico</a>
        <a href="/config.html" class="menu-item">Configurações</a>
        <a href="/regras.html" class="menu-item">Termos e Regras</a>
        <a href="#" class="menu-item" onclick="logout()">Sair</a>
    `;

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
    try {
        const { data: pedidos, error } = await supabase
            .from('pedido')
            .select('id, titulo, categoria, status')
            .eq('user_id', usuarioLogado.id)
            .order('created_at', { ascending: false });

        if (error) {
            alert('Erro ao carregar histórico: ' + error.message);
            return;
        }

        const tbody = document.getElementById('historico-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        for (const pedido of pedidos) {
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

            const { data: doacoes, error: doacaoError } = await supabase
                .from('doacao')
                .select('id, codigo_rastreio')
                .eq('pedido_id', pedido.id);

            if (doacaoError) {
                expandContent.innerHTML = '<p>Erro ao carregar códigos de rastreio.</p>';
                return;
            }

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
            } else if (pedido.status === STATUS_PEDIDOS.PENDENTE || pedido.status === STATUS_PEDIDOS.DISPONIVEL) {
                let html = '';
                doacoes.forEach(doacao => {
                    html += `
                        <div class="doacao-item">
                            <input value="${doacao.codigo_rastreio}" readonly>
                            <div>
                                <label><input type="checkbox" name="opt-${doacao.id}" value="invalido">Código Inválido</label>
                                <label><input type="checkbox" name="opt-${doacao.id}" value="entregue">Produto Entregue</label>
                            </div>
                            <p class="note">Conferir o código com atenção.</p>
                            <button class="confirm-btn" data-doacao-id="${doacao.id}">Confirmar</button>
                        </div>
                    `;
                });
                expandContent.innerHTML = html;

                doacoes.forEach(doacao => {
                    const item = expandContent.querySelector(`.doacao-item [data-doacao-id="${doacao.id}"]`).parentNode;
                    const [invalido, entregue] = item.querySelectorAll(`input[name="opt-${doacao.id}"]`);
                    const confirmBtn = item.querySelector('.confirm-btn');

                    [invalido, entregue].forEach(cb => {
                        cb.onchange = () => {
                            if (cb.checked) [invalido, entregue].forEach(other => other !== cb && (other.checked = false));
                        };
                    });

                    confirmBtn.onclick = async () => {
                        const checked = item.querySelector(`input[name="opt-${doacao.id}"]:checked`);
                        if (!checked) return alert('Selecione uma opção');

                        if (checked.value === 'entregue') {
                            const { error } = await supabase
                                .from('pedido')
                                .update({ status: STATUS_PEDIDOS.CONCLUIDO, completion_date: new Date().toISOString() })
                                .eq('id', pedido.id);
                            if (error) return alert('Erro ao atualizar status: ' + error.message);
                        } else if (checked.value === 'invalido') {
                            const { error } = await supabase
                                .from('doacao')
                                .delete()
                                .eq('id', doacao.id);
                            if (error) return alert('Erro ao remover doação: ' + error.message);

                            const { count, error: countError } = await supabase
                                .from('doacao')
                                .select('count', { count: 'exact' })
                                .eq('pedido_id', pedido.id);
                            if (countError) return alert('Erro ao verificar doações: ' + countError.message);
                            if (count === 0) {
                                await supabase
                                    .from('pedido')
                                    .update({ status: STATUS_PEDIDOS.DISPONIVEL })
                                    .eq('id', pedido.id);
                            }
                        }
                        carregarHistorico();
                    };
                });
            } else if (pedido.status === STATUS_PEDIDOS.CONCLUIDO) {
                let html = doacoes.map(doacao => `<p>Código de Rastreio: ${doacao.codigo_rastreio || 'N/A'}</p>`).join('');
                expandContent.innerHTML = html;
            }

            row.querySelector('.expand-btn').onclick = (e) => {
                expandContent.style.display = expandContent.style.display === 'block' ? 'none' : 'block';
                e.target.textContent = expandContent.style.display === 'block' ? '▲' : '▼';
            };
        }
    } catch (err) {
        alert('Erro ao carregar histórico: ' + err.message);
    }
}

// Função preencherDadosUsuario
async function preencherDadosUsuario() {
    if (!usuarioLogado) {
        showError('Nenhum usuário logado.');
        return;
    }
    try {
        const { data: usuario, error } = await supabase
            .from('usuario')
            .select('nome, email, username, bio, photo_url')
            .eq('id', usuarioLogado.id)
            .single();
        if (error) throw error;

        usuarioLogado = {
            ...usuarioLogado,
            nome: usuario.nome || usuarioLogado.nome || 'Usuário',
            email: usuario.email || usuarioLogado.email || '',
            username: usuario.username || usuarioLogado.username || '',
            bio: usuario.bio || '',
            photo_url: usuario.photo_url || 'https://placehold.co/100x100?text=Perfil'
        };
        localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));

        document.getElementById('nome').value = usuarioLogado.nome || '';
        document.getElementById('email').value = usuarioLogado.email || '';
        document.getElementById('username').value = usuarioLogado.username || '';
        document.getElementById('bio').value = usuarioLogado.bio || '';
        document.getElementById('profile-img').src = usuarioLogado.photo_url;
    } catch (err) {
        showError('Falha ao carregar perfil: ' + err.message);
    }
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
        categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        CATEGORIAS.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaSelect.appendChild(option);
        });
    }
}

async function criarPedido(e) {
    e.preventDefault();
    
    if (!usuarioLogado) {
        alert('Faça login para criar pedidos');
        return;
    }
    
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
    
    const titulo = document.getElementById('titulo').value.trim();
    const categoria = document.getElementById('categoria').value;
    const descricao = document.getElementById('descricao').value.trim();
    const fotoInput = document.getElementById('foto-input').files[0];
    const termos = document.getElementById('termos-pedido').checked;
    
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
    if (PRODUTOS_PROIBIDOS.some(proibido => titulo.toLowerCase().includes(proibido) || descricao.toLowerCase().includes(proibido))) {
        alert('O pedido contém itens proibidos.');
        return;
    }
    
    const safeFileName = fotoInput.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${usuarioLogado.id}/${Date.now()}_${safeFileName}`;
    const { error: uploadError } = await supabase.storage
        .from('pedidos')
        .upload(fileName, fotoInput, { upsert: false });
    
    if (uploadError) {
        alert('Erro ao fazer upload da foto: ' + uploadError.message);
        return;
    }
    
    const fotoUrl = `${SUPABASE_URL}/storage/v1/object/public/pedidos/${fileName}`;
    
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
    
    alert('Pedido criado com sucesso!');
    window.location.href = 'index.html';
}

// Funções auxiliares
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    } else {
        alert(message);
    }
}

function clearError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

function validatePassword(senha, confirmarSenha) {
    if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (!/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) return 'A senha deve conter letras e números.';
    return null;
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem('cavalodado_token');
        localStorage.removeItem('cavalodado_usuario');
        usuarioLogado = null;
        alert('Logout realizado com sucesso!');
        window.location.href = 'index.html';
    } catch (error) {
        alert('Erro ao sair: ' + error.message);
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
                bio: userData.user.user_metadata.bio || '',
                photo_url: userData.user.user_metadata.photo_url || 'https://placehold.co/100x100?text=Perfil'
            };
            localStorage.setItem('cavalodado_usuario', JSON.stringify(usuarioLogado));
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
    }
});
