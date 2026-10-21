// CRUD de recursos des del navegador (fetch cap a /resources)
const $ = el => document.querySelector(el)
const form = $('#resource-form')
const message = $('#message')
const cancelButton = $('#cancel-edit')
let editingId = null // null = estem creant; un número = estem editant aquest recurs

const showMessage = (text, ok) => {
    message.innerText = text
    message.style.color = ok ? 'green' : 'red'
}

// Envia la petició a l'API. Si la resposta no és correcta, llança l'error del servidor
const sendRequest = async (url, method, body) => {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Error ' + res.status)
    return data
}

const resetForm = () => {
    editingId = null
    form.reset()
    $('#form-title').innerText = 'Nou recurs'
    $('#save-btn').innerText = 'Crear recurs'
    cancelButton.hidden = true
}

// CREATE o UPDATE segons editingId
form?.addEventListener('submit', async e => {
    e.preventDefault()
    const body = {
        name: $('#res-name').value,
        type: $('#res-type').value,
        capacity: Number($('#res-capacity').value)
    }
    try {
        if (editingId) {
            await sendRequest('/resources/' + editingId, 'PUT', body)
        } else {
            await sendRequest('/resources', 'POST', body)
        }
        window.location.reload()
    } catch (error) {
        showMessage(error.message, false)
    }
})

// Botó "Editar": omple el formulari amb les dades del recurs
document.querySelectorAll('[data-edit]').forEach(button => {
    button.addEventListener('click', () => {
        editingId = button.dataset.edit
        $('#res-name').value = button.dataset.name
        $('#res-type').value = button.dataset.type
        $('#res-capacity').value = button.dataset.capacity
        $('#form-title').innerText = 'Editar recurs #' + editingId
        $('#save-btn').innerText = 'Desar canvis'
        cancelButton.hidden = false
        form.scrollIntoView()
    })
})

cancelButton?.addEventListener('click', resetForm)

// DELETE
document.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', async () => {
        if (!confirm('Segur que vols eliminar aquest recurs?')) return
        try {
            await sendRequest('/resources/' + button.dataset.delete, 'DELETE')
            window.location.reload()
        } catch (error) {
            showMessage(error.message, false)
        }
    })
})
