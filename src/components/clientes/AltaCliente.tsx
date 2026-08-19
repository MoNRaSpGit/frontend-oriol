import { useState, type FormEvent } from 'react'
import { crearCliente } from '../../services/clientes.service'
import { mensajeDeError } from '../../utils/errores'
import type { Cliente } from '../../types/cliente'

const AltaCliente = ({ onCreado }: { onCreado: (cliente: Cliente) => void }) => {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Ingresá el nombre del cliente.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const cliente = await crearCliente(nombre.trim(), telefono.trim() || undefined)
      onCreado(cliente)
      setNombre('')
      setTelefono('')
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear el cliente.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Teléfono (opcional)</label>
        <input
          type="text"
          className="form-control"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </div>
      {error && <p className="text-danger">{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg w-100" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}

export default AltaCliente
