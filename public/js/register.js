// Lògica del navegador per als formularis de login, registre i logout
const $ = el => document.querySelector(el);
const loginForm = $('#login-form')
const loginSpan = $('#login-form span')

const registerForm = $('#register-form')
const registerSpan = $('#register-form span')

const logoutButton = $('#close-session')

loginForm?.addEventListener('submit', e => {
    e.preventDefault()
    const username = $('#login-username').value
    const password = $('#login-password').value

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
        .then(async res => {
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                loginSpan.innerText = 'Sessió iniciada. Entrant...'
                loginSpan.style.color = 'green'
                setTimeout(() => {
                    window.location.href = '/protected'
                }, 1000)
            } else {
                loginSpan.innerText = data.error || 'Error en iniciar sessió'
                loginSpan.style.color = 'red'
            }
        })
});

registerForm?.addEventListener('submit', e => {
    e.preventDefault()
    const username = $('#register-username').value
    const password = $('#register-password').value
    const confirmPassword = $('#register-confirm-password').value

    if (password != confirmPassword) {
        registerSpan.innerText = 'Les contrasenyes no coincideixen'
        registerSpan.style.color = 'red'
        return
    }

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
        .then(async res => {
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                registerSpan.innerText = 'Usuari registrat. Entrant...'
                registerSpan.style.color = 'green'
                setTimeout(() => {
                    window.location.href = '/protected'
                }, 1000)
            } else {
                registerSpan.innerText = data.error || 'Error en registrar l\'usuari'
                registerSpan.style.color = 'red'
            }
        })
});

logoutButton?.addEventListener('click', e => {
    e.preventDefault()
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(() => {
            window.location.href = '/'
        })
});
