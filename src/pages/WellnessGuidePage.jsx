import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  BookOpen,
  CircleAlert,
  Droplets,
  ExternalLink,
  HeartPulse,
  MoonStar,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Wind,
  X,
} from 'lucide-react'
import Panel from '../components/ui/Panel'
import { getGuidance } from '../api/client'

// Contenido 100% servido por el backend (curado, con fuentes y fechas de
// revisión). Esta página solo lo presenta; no añade criterios propios.

const METRIC_ICONS = {
  heart_rate: HeartPulse,
  temperature: Thermometer,
  blood_pressure: Activity,
  oxygen_saturation: Wind,
  glucose: Droplets,
  sleep: MoonStar,
}

const CONTEXT_LABELS = {
  space: 'En el espacio',
  terrestrial: 'En la Tierra',
  both: 'Espacio y Tierra',
}

const GUIDE_SECTIONS = [
  {
    id: 'questions',
    title: 'Preguntas del reto NASA',
    eyebrow: 'Punto de partida',
    description: 'Respuestas claras sobre mediciones, exámenes, riesgos y prevención durante una misión.',
    icon: BookOpen,
  },
  {
    id: 'measures',
    title: 'Medidas preventivas',
    eyebrow: 'Bienestar con respaldo',
    description: 'Acciones para el espacio y la Tierra, con su evidencia, contexto y límites.',
    icon: ShieldCheck,
  },
  {
    id: 'indicators',
    title: 'Guía por indicador',
    eyebrow: 'Lecturas e instrumentos',
    description: 'Qué mide cada indicador, para qué sirve y qué información no puede mostrar por sí solo.',
    icon: Activity,
  },
  {
    id: 'medical',
    title: 'Evaluación médica',
    eyebrow: 'Decisiones clínicas',
    description: 'Situaciones que requieren la valoración del equipo médico y no dependen de la aplicación.',
    icon: Stethoscope,
  },
  {
    id: 'limits',
    title: 'Límites de ASTRA',
    eyebrow: 'Lo que no monitorea',
    description: 'Aspectos de la salud espacial que no están representados por los indicadores de la plataforma.',
    icon: CircleAlert,
  },
  {
    id: 'sources',
    title: 'Fuentes y referencias',
    eyebrow: 'Biblioteca verificada',
    description: 'Consulta el origen, alcance y fecha de revisión de las fuentes usadas en esta guía.',
    icon: ExternalLink,
  },
]

function SourceChips({ ids, sources }) {
  if (!ids?.length) return null
  return (
    <div className="guide-sources">
      {ids.map((id) => {
        const src = sources[id]
        if (!src) return null
        return (
          <a key={id} className="guide-source-chip" href={src.url} target="_blank" rel="noreferrer" title={src.scope}>
            <BookOpen size={12} />
            <span>{src.title}</span>
            <ExternalLink size={11} />
          </a>
        )
      })}
    </div>
  )
}

function MeasureCard({ measure, sources }) {
  return (
    <article className="guide-measure-card">
      <div className="guide-measure-head">
        <h4>{measure.title}</h4>
        <span className={`guide-context-badge guide-context-badge--${measure.context}`}>
          {CONTEXT_LABELS[measure.context] || measure.context}
        </span>
      </div>
      <p>{measure.action}</p>
      <p className="guide-evidence"><strong>Evidencia: </strong>{measure.evidence}</p>
      <p className="guide-limits"><strong>Límites: </strong>{measure.limits}</p>
      <SourceChips ids={measure.source_ids} sources={sources} />
    </article>
  )
}

function IndicatorGuide({ item, sources }) {
  const Icon = METRIC_ICONS[item.code] || Activity
  return (
    <div className="guide-indicator-detail">
      <div className="guide-indicator-columns">
        <section>
          <h4><Icon size={15} /> Qué mide y con qué</h4>
          <p>{item.what}</p>
          <ul>
            {item.instruments.map((inst) => <li key={inst}>{inst}</li>)}
          </ul>
          <h4>Para qué sirve</h4>
          <p>{item.purpose}</p>
        </section>
        <section>
          <h4>Riesgos espaciales relacionados</h4>
          <ul>
            {item.spaceflight_links.map((link) => <li key={link}>{link}</li>)}
          </ul>
          <p className="guide-note">Relación general documentada en astronautas; no prueba causalidad sobre una lectura personal.</p>
          <h4>Lo que no muestra</h4>
          <p>{item.not_shown}</p>
        </section>
      </div>
      <div className="guide-attention">
        <h4><CircleAlert size={15} /> Cuándo podría requerir atención</h4>
        <p>{item.attention}</p>
        <SourceChips ids={item.attention_source_ids} sources={sources} />
      </div>
      {item.actions?.length > 0 && (
        <div className="guide-indicator-actions">
          <h4><ShieldCheck size={15} /> Medidas preventivas con respaldo</h4>
          <div className="guide-measures-grid">
            {item.actions.map((measure) => <MeasureCard key={measure.id} measure={measure} sources={sources} />)}
          </div>
        </div>
      )}
      <SourceChips ids={item.source_ids} sources={sources} />
    </div>
  )
}

function SectionContent({ sectionId, guidance, sources, activeCode, onActiveCodeChange }) {
  if (sectionId === 'questions') {
    return (
      <div className="guide-challenge-grid">
        {guidance.challenge_questions.map((q) => (
          <article key={q.question} className="guide-challenge-card">
            <h4>{q.question}</h4>
            <p>{q.answer}</p>
            <SourceChips ids={q.source_ids} sources={sources} />
          </article>
        ))}
      </div>
    )
  }

  if (sectionId === 'measures') {
    return (
      <>
        <p className="guide-panel-note">
          Cada medida declara su contexto, evidencia y límites. Las referencias terrestres no son protocolos de vuelo.
        </p>
        <div className="guide-measures-grid">
          {guidance.measures.map((measure) => (
            <MeasureCard key={measure.id} measure={measure} sources={sources} />
          ))}
        </div>
      </>
    )
  }

  if (sectionId === 'indicators') {
    const active = guidance.indicators.find((item) => item.code === activeCode) ?? guidance.indicators[0]
    return (
      <>
        <div className="guide-metric-pills" role="tablist" aria-label="Indicadores">
          {guidance.indicators.map((item) => {
            const Icon = METRIC_ICONS[item.code] || Activity
            return (
              <button
                key={item.code}
                role="tab"
                aria-selected={item.code === active.code}
                className={`guide-metric-pill ${item.code === active.code ? 'is-active' : ''}`}
                onClick={() => onActiveCodeChange(item.code)}
                type="button"
              >
                <Icon size={15} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>
        <IndicatorGuide item={active} sources={sources} />
      </>
    )
  }

  if (sectionId === 'medical') {
    return (
      <>
        <p className="guide-panel-note">
          Estas decisiones corresponden al equipo médico de la misión; no las toma la aplicación ni la IA.
        </p>
        <div className="guide-medical-list">
          {guidance.medical_only.map((block) => (
            <article key={block.title} className="guide-medical-item">
              <h4><Stethoscope size={15} /> {block.title}</h4>
              <p>{block.detail}</p>
              <SourceChips ids={block.source_ids} sources={sources} />
            </article>
          ))}
        </div>
      </>
    )
  }

  if (sectionId === 'limits') {
    return (
      <>
        <ul className="guide-not-monitored">
          {guidance.not_monitored.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="guide-note">
          Los cinco peligros del vuelo espacial de NASA HRP incluyen riesgos que los seis indicadores de ASTRA no capturan.
        </p>
      </>
    )
  }

  return (
    <>
      <p className="guide-panel-note">
        Contenido curado por el equipo y revisado el {guidance.reviewed_at}. Cada fuente declara su alcance.
      </p>
      <ul className="guide-source-list">
        {guidance.sources.map((src) => (
          <li key={src.id}>
            <a href={src.url} target="_blank" rel="noreferrer">
              {src.title} <ExternalLink size={12} />
            </a>
            <span className="guide-source-meta">Revisada: {src.reviewed_at}</span>
            <p>{src.scope}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function GuideSectionDialog({ section, guidance, sources, activeCode, onActiveCodeChange, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    dialog.showModal()
    document.documentElement.classList.add('guide-dialog-open')

    return () => {
      document.documentElement.classList.remove('guide-dialog-open')
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="guide-section-dialog"
      aria-labelledby="guide-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="guide-section-dialog__header">
        <div>
          <span className="section-title">{section.eyebrow}</span>
          <h2 id="guide-dialog-title">{section.title}</h2>
          <p>{section.description}</p>
        </div>
        <button type="button" className="guide-section-dialog__close" onClick={onClose} aria-label="Cerrar">
          <X size={24} />
        </button>
      </div>
      <div className="guide-section-dialog__body">
        <SectionContent
          sectionId={section.id}
          guidance={guidance}
          sources={sources}
          activeCode={activeCode}
          onActiveCodeChange={onActiveCodeChange}
        />
      </div>
      <div className="guide-section-dialog__footer">
        Información educativa y general. No sustituye la evaluación del equipo médico de la misión.
      </div>
    </dialog>
  )
}

export default function WellnessGuidePage({ onNotify }) {
  const [guidance, setGuidance] = useState(null)
  const [error, setError] = useState('')
  const [activeCode, setActiveCode] = useState('heart_rate')
  const [selectedSection, setSelectedSection] = useState(null)

  useEffect(() => {
    getGuidance()
      .then((data) => setGuidance(data))
      .catch(() => {
        setError('No se pudo cargar la orientación de bienestar.')
        onNotify?.('No se pudo cargar la orientación de bienestar.')
      })
  }, [onNotify])

  const sources = useMemo(() => {
    const map = {}
    for (const src of guidance?.sources ?? []) map[src.id] = src
    return map
  }, [guidance])

  if (error) return <Panel className="guide-error">{error}</Panel>
  if (!guidance) return <Panel className="guide-loading">Cargando orientación de bienestar…</Panel>

  return (
    <div className="wellness-guide-page">
      <header className="page-header-pro guide-header">
        <span className="section-title">WELLNESS GUIDE</span>
        <h1>Bienestar y prevención</h1>
        <p>{guidance.intro}</p>
      </header>

      <section className="guide-library" aria-label="Secciones de la guía de bienestar">
        {GUIDE_SECTIONS.map((section, index) => {
          const Icon = section.icon
          return (
            <Panel as="article" key={section.id} className={`guide-library-card guide-library-card--${section.id}`}>
              <div className="guide-library-card__top">
                <span className="guide-library-card__icon"><Icon size={25} /></span>
                <span className="guide-library-card__count">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <span className="section-title">{section.eyebrow}</span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <button type="button" onClick={() => setSelectedSection(section)}>
                Saber más <span aria-hidden="true">→</span>
              </button>
            </Panel>
          )
        })}
      </section>

      {selectedSection && (
        <GuideSectionDialog
          section={selectedSection}
          guidance={guidance}
          sources={sources}
          activeCode={activeCode}
          onActiveCodeChange={setActiveCode}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </div>
  )
}
