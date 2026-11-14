import { useEffect, useState } from 'react'
import { Camera, Link2, Orbit, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import Panel from '../ui/Panel'
import { formatWhen } from '../../data/format'

const DEFAULT_AVATAR = '/assets/astronauta.png'

function AvatarImage({ src, alt }) {
  return (
    <img
      key={src || DEFAULT_AVATAR}
      src={src || DEFAULT_AVATAR}
      alt={alt}
      onError={(event) => { event.currentTarget.src = DEFAULT_AVATAR }}
    />
  )
}

export default function ProfileCard({ user, sessionDay = 0, sessionStartedAt, onChangeProfileImage }) {
  const [editingPhoto, setEditingPhoto] = useState(false)
  const [draftUrl, setDraftUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const profileImageUrl = user?.profile_image_url || ''

  useEffect(() => {
    if (!editingPhoto) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !saving) setEditingPhoto(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [editingPhoto, saving])

  const openEditor = () => {
    setDraftUrl(profileImageUrl)
    setError('')
    setEditingPhoto(true)
  }

  const savePhoto = async (event) => {
    event.preventDefault()
    const value = draftUrl.trim()
    try {
      const parsed = new URL(value)
      if (parsed.protocol !== 'https:') throw new Error()
    } catch {
      setError('Pega una URL válida que comience por https://')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onChangeProfileImage?.(value)
      setEditingPhoto(false)
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar la foto.')
    } finally {
      setSaving(false)
    }
  }

  const removePhoto = async () => {
    setSaving(true)
    setError('')
    try {
      await onChangeProfileImage?.(null)
      setDraftUrl('')
      setEditingPhoto(false)
    } catch (requestError) {
      setError(requestError.message || 'No se pudo restaurar la imagen.')
    } finally {
      setSaving(false)
    }
  }

  const photoModal = editingPhoto && createPortal(
    <div
      className="modal-backdrop profile-photo-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) setEditingPhoto(false)
      }}
    >
      <form className="profile-photo-modal glass-panel" onSubmit={savePhoto} role="dialog" aria-modal="true" aria-labelledby="profile-photo-title">
        <button className="modal-close" type="button" onClick={() => setEditingPhoto(false)} disabled={saving} aria-label="Cerrar">
          <X size={18} />
        </button>
        <span className="profile-photo-modal__eyebrow">PERFIL DE MISIÓN</span>
        <h2 id="profile-photo-title">Foto de perfil</h2>
        <p>Por ahora puedes usar el enlace directo de una imagen. Después podremos permitir subirla desde el dispositivo.</p>

        <div className="profile-photo-preview">
          <AvatarImage src={draftUrl.trim()} alt="Vista previa de la foto de perfil" />
        </div>

        <label className="profile-photo-field">
          <span>URL de la imagen</span>
          <div>
            <Link2 size={17} aria-hidden="true" />
            <input
              type="url"
              value={draftUrl}
              onChange={(event) => { setDraftUrl(event.target.value); setError('') }}
              placeholder="https://ejemplo.com/mi-foto.jpg"
              autoFocus
              disabled={saving}
              maxLength={2048}
              required
            />
          </div>
        </label>

        {error && <p className="profile-photo-error" role="alert">{error}</p>}

        <div className="profile-photo-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar foto'}
          </button>
          <button className="secondary-button" type="button" onClick={removePhoto} disabled={saving || !profileImageUrl}>
            <Trash2 size={16} />
            Usar imagen predeterminada
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )

  return (
    <>
      <Panel className="profile-card">
        <div className="profile-card__avatar-wrap">
          <button className="profile-avatar-button profile-avatar-glow" type="button" onClick={openEditor} aria-label="Cambiar foto de perfil">
            <AvatarImage src={profileImageUrl} alt={`Foto de perfil de ${user?.name || 'Astronauta'}`} />
            <span><Camera size={14} /></span>
          </button>
        </div>

        <div className="profile-card__body">
          <h2>{user?.name || 'Maria Torres'}</h2>
          <p className="profile-card__email">{user?.email || 'maria@gmail.com'}</p>
          <div className="profile-card__status">
            <span className="status-dot-green" />
            <span>Último acceso: {sessionStartedAt ? formatWhen(sessionStartedAt) : 'ahora'}</span>
          </div>
        </div>

        <div className="profile-card__badge-day">
          <Orbit size={18} className="orbit-icon" />
          <span>Día {sessionDay}</span>
        </div>
      </Panel>
      {photoModal}
    </>
  )
}
