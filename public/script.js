const API_URL = 'http://localhost:3000/api/auth';

const initialScreen = document.getElementById('initialScreen');
const registerFormContainer = document.getElementById('registerFormContainer');
const loginFormContainer = document.getElementById('loginFormContainer');
const profileContainer = document.getElementById('profileContainer');
const profileInfo = document.getElementById('profileInfo');
const messageDiv = document.getElementById('message');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

function togglePassword(passwordFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    const toggleIcon = document.querySelector(`[onclick="togglePassword('${passwordFieldId}')"]`);
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.textContent = '🙈';
        toggleIcon.classList.add('active');
    } else {
        passwordField.type = 'password';
        toggleIcon.textContent = '👁️';
        toggleIcon.classList.remove('active');
    }
}

function showMessage(message, type = 'success') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

function showInitialScreen() {
    initialScreen.classList.remove('hidden');
    registerFormContainer.classList.add('hidden');
    loginFormContainer.classList.add('hidden');
    profileContainer.classList.add('hidden');
    messageDiv.classList.add('hidden');
    
    registerForm.reset();
    loginForm.reset();
    
    document.getElementById('regPassword').type = 'password';
    document.getElementById('loginPassword').type = 'password';
    
    const toggleIcons = document.querySelectorAll('.toggle-password');
    toggleIcons.forEach(icon => {
        icon.textContent = '👁️';
        icon.classList.remove('active');
    });
}

function showForm(formType) {
    initialScreen.classList.add('hidden');
    messageDiv.classList.add('hidden');
    
    if (formType === 'register') {
        registerFormContainer.classList.remove('hidden');
        loginFormContainer.classList.add('hidden');
    } else if (formType === 'login') {
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
    }
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value
    };

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('¡Usuario registrado exitosamente!');
            registerForm.reset();
            localStorage.setItem('token', data.token);
            loadUserProfile();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión con el servidor', 'error');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameOrEmail = document.getElementById('loginUsernameOrEmail').value;
    const password = document.getElementById('loginPassword').value;

    const loginData = {
        password: password
    };

    if (usernameOrEmail.includes('@')) {
        loginData.email = usernameOrEmail;
    } else {
        loginData.username = usernameOrEmail;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('¡Login exitoso!');
            loginForm.reset();
            localStorage.setItem('token', data.token);
            loadUserProfile();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión con el servidor', 'error');
    }
});

async function loadUserProfile() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            showProfile(data.user);
        } else {
            localStorage.removeItem('token');
            showInitialScreen();
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
        showInitialScreen();
    }
}

function timeSince(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " años";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " meses";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " días";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " horas";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutos";
    }
    return Math.floor(seconds) + " segundos";
}

function showProfile(user) {
    initialScreen.classList.add('hidden');
    registerFormContainer.classList.add('hidden');
    loginFormContainer.classList.add('hidden');
    profileContainer.classList.remove('hidden');
    
    const registrationDate = new Date(user.createdAt);
    const formattedDate = registrationDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = registrationDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    profileInfo.innerHTML = `
        <p><strong>Usuario:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>ID:</strong> ${user.id}</p>
        <p><strong>Fecha de registro:</strong> ${formattedDate}</p>
        <p><strong>Hora de registro:</strong> ${formattedTime}</p>
        <p><strong>Hace:</strong> ${timeSince(registrationDate)}</p>
    `;
}

function logout() {
    localStorage.removeItem('token');
    showMessage('Sesión cerrada correctamente');
    showInitialScreen();
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        loadUserProfile();
    } else {
        showInitialScreen();
    }
});