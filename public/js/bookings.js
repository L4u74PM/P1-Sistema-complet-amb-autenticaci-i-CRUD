// CRUD de reserves des del navegador (fetch cap a /bookings)
const $ = el => document.querySelector(el)
const form = $('#booking-form')
const message = $('#message')
const cancelButton = $('#cancel-edit')
let editingId = null // null = estem creant; un número = estem editant aquesta reserva

const showMessage = (text, ok) => {
    message.innerText = text
    message.style.color = ok ? 'green' : 'red'
}

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

// Data ISO (UTC) -> format que entén <input type="datetime-local"> (hora local)
const toInputValue = iso => {
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
}

const resetForm = () => {
    editingId = null
    form.reset()
    $('#form-title').innerText = 'Nova reserva'
    $('#save-btn').innerText = 'Reservar'
    cancelButton.hidden = true
}

// CREATE o UPDATE segons editingId
form?.addEventListener('submit', async e => {
    e.preventDefault()
    const body = {
        resourceId: Number($('#bk-resource').value),
        start: new Date($('#bk-start').value).toISOString(),
        end: new Date($('#bk-end').value).toISOString()
    }
    try {
        if (editingId) {
            await sendRequest('/bookings/' + editingId, 'PUT', body)
        } else {
            await sendRequest('/bookings', 'POST', body)
        }
        window.location.reload()
    } catch (error) {
        showMessage(error.message, false)
    }
})

// Botó "Editar": omple el formulari amb les dades de la reserva
document.querySelectorAll('[data-edit]').forEach(button => {
    button.addEventListener('click', () => {
        editingId = button.dataset.edit
        $('#bk-resource').value = button.dataset.resource
        $('#bk-start').value = toInputValue(button.dataset.start)
        $('#bk-end').value = toInputValue(button.dataset.end)
        $('#form-title').innerText = 'Editar reserva #' + editingId
        $('#save-btn').innerText = 'Desar canvis'
        cancelButton.hidden = false
        form.scrollIntoView()
    })
})

cancelButton?.addEventListener('click', resetForm)

// DELETE
document.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', async () => {
        if (!confirm('Segur que vols cancel·lar aquesta reserva?')) return
        try {
            await sendRequest('/bookings/' + button.dataset.delete, 'DELETE')
            window.location.reload()
        } catch (error) {
            showMessage(error.message, false)
        }
    })
})
