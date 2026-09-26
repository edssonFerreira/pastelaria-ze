// CONFIGURAÇÕES DO SUPABASE
const SUPABASE_URL = 'https://zbbpmfzwshuezocsgfzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-BtbW5MtM2MXXPdnZG5jJw_twbIgmbw';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHATSAPP_NUMBER = "5511976546168"; 

let products = [];
let cart = [];

// SESSÃO DO USUÁRIO NO LOCALSTORAGE
function getLoggedUser() {
    return JSON.parse(localStorage.getItem('pastelaria_logged_user')) || null;
}

function setLoggedUser(user) {
    if (user) {
        localStorage.setItem('pastelaria_logged_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('pastelaria_logged_user');
    }
    checkAuthState();
}

function checkAuthState() {
    const loggedUser = getLoggedUser();
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const userGreeting = document.getElementById('user-greeting');

    if (loggedUser) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userGreeting.innerText = `Olá, ${loggedUser.nome_completo || loggedUser.username}`;
    } else {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

// BUSCAR CARDÁPIO NO SUPABASE
async function renderProducts() {
    try {
        const { data, error } = await _supabase.from('produtos').select('*');
        if (error) throw error;

        products = data;

        const salgadosContainer = document.getElementById('menu-salgados');
        const docesContainer = document.getElementById('menu-doces');
        const bebidasContainer = document.getElementById('menu-bebidas');

        if (!salgadosContainer) return;

        salgadosContainer.innerHTML = '';
        docesContainer.innerHTML = '';
        bebidasContainer.innerHTML = '';

        products.forEach(product => {
            const priceFormatted = parseFloat(product.preco).toFixed(2).replace('.', ',');
            const card = `
                <div class="card-item">
                    <img src="${product.imagem_url}" alt="${product.nome}" class="card-img">
                    <div class="card-body">
                        <div>
                            <h3 class="card-title">${product.nome}</h3>
                            <p class="card-desc">${product.descricao}</p>
                        </div>
                        <div class="card-footer">
                            <span class="card-price">R$ ${priceFormatted}</span>
                            <button class="btn-add" onclick="addToCart(${product.id})">
                                <i class="fa-solid fa-plus"></i> Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            if (product.categoria === 'salgados') salgadosContainer.innerHTML += card;
            if (product.categoria === 'doces') docesContainer.innerHTML += card;
            if (product.categoria === 'bebidas') bebidasContainer.innerHTML += card;
        });
    } catch (error) {
        console.error("Erro ao carregar cardápio:", error);
    }
}

// LOGIN VIA SUPABASE
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await _supabase
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .eq('senha', password)
            .maybeSingle();

        if (error || !data) {
            alert("Usuário ou senha incorretos!");
            return;
        }

        setLoggedUser(data);
        toggleLoginModal();
        alert(`Bem-vindo, ${data.nome_completo}!`);
    } catch (err) {
        alert("Erro ao tentar realizar login.");
    }
}

// CADASTRO VIA SUPABASE
async function handleRegister(event) {
    event.preventDefault();

    const payload = {
        username: document.getElementById('reg-username').value.trim(),
        nome_completo: document.getElementById('reg-fullname').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        telefone: document.getElementById('reg-phone').value.trim(),
        cpf: document.getElementById('reg-cpf').value.trim(),
        endereco: document.getElementById('reg-address').value.trim(),
        senha: document.getElementById('reg-password').value
    };

    try {
        const { data, error } = await _supabase
            .from('usuarios')
            .insert([payload])
            .select()
            .single();

        if (error) {
            alert("Erro ao cadastrar: " + error.message);
            return;
        }

        alert("Conta criada com sucesso!");
        setLoggedUser(data);
        toggleRegisterModal();
    } catch (err) {
        alert("Erro na conexão durante o cadastro.");
    }
}

// CONTROLE DE MODAIS
function toggleLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function toggleRegisterModal() {
    const modal = document.getElementById('register-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function switchModal(from, to) {
    if (from === 'login') toggleLoginModal();
    if (from === 'register') toggleRegisterModal();
    if (to === 'login') toggleLoginModal();
    if (to === 'register') toggleRegisterModal();
}

function logoutUser() {
    setLoggedUser(null);
    alert("Você saiu da sua conta.");
}

// CARRINHO DE COMPRAS
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, price: parseFloat(product.preco), quantity: 1 });
    }

    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.innerText = totalCount;

    cartItemsContainer.innerHTML = '';
    let totalMoney = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#888;">Seu carrinho está vazio.</p>';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalMoney += itemTotal;

            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.nome}</h4>
                        <p>R$ ${item.price.toFixed(2).replace('.', ',')} x ${item.quantity}</p>
                    </div>
                    <div><strong>R$ ${itemTotal.toFixed(2).replace('.', ',')}</strong></div>
                </div>
            `;
        });
    }

    cartTotal.innerText = `Total: R$ ${totalMoney.toFixed(2).replace('.', ',')}`;
}

function toggleCartModal() {
    const modal = document.getElementById('cart-modal');
    const isOpening = modal.style.display !== 'flex';
    modal.style.display = isOpening ? 'flex' : 'none';

    if (isOpening) {
        const loggedUser = getLoggedUser();
        if (loggedUser) {
            document.getElementById('client-name').value = loggedUser.nome_completo || loggedUser.username;
            document.getElementById('client-address').value = loggedUser.endereco || '';
        }
    }
}

// SALVAR PEDIDO NO SUPABASE E REDIRECIONAR PARA O WHATSAPP
async function sendOrderToWhatsApp() {
    if (cart.length === 0) {
        alert("Adicione pelo menos um item ao carrinho!");
        return;
    }

    const name = document.getElementById('client-name').value;
    const address = document.getElementById('client-address').value;
    const loggedUser = getLoggedUser();

    if (!name || !address) {
        alert("Por favor, preencha seu nome e endereço.");
        return;
    }

    if (!loggedUser) {
        alert("Você precisa estar logado para fazer um pedido!");
        toggleLoginModal();
        return;
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    try {
        const { data: pedido, error: errPedido } = await _supabase
            .from('pedidos')
            .insert([{
                usuario_id: loggedUser.id,
                nome_cliente: name,
                endereco_entrega: address,
                valor_total: total
            }])
            .select()
            .single();

        if (errPedido) throw errPedido;

        const itensPayload = cart.map(item => ({
            pedido_id: pedido.id,
            produto_id: item.id,
            quantidade: item.quantity,
            preco_unitario: item.price
        }));

        await _supabase.from('itens_pedido').insert(itensPayload);

    } catch (err) {
        console.error("Erro ao registrar pedido no banco de dados:", err);
    }

    let message = `*NOVO PEDIDO - PASTELARIA DO ZÉ*\n\n`;
    message += `*Cliente:* ${name}\n`;
    message += `*Endereço/Obs:* ${address}\n\n`;
    message += `*ITENS DO PEDIDO:*\n`;

    cart.forEach(item => {
        message += `- ${item.quantity}x ${item.nome} (R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')})\n`;
    });

    message += `\n*TOTAL:* R$ ${total.toFixed(2).replace('.', ',')}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    checkAuthState();
});