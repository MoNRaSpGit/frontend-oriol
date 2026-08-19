import { useEffect, useState } from 'react'
import { getResumenMes, getHistorialMeses, editarCierreDia } from '../../services/panel.service'
import { mensajeDeError } from '../../utils/errores'
import { useTasaDolar } from '../../hooks/useTasaDolar'
import type { DiaMes, ResumenMes, TotalMes } from '../../types/panel'
import GraficoVentasMensuales from './GraficoVentasMensuales'
import EditarCierreDiaModal from './EditarCierreDiaModal'
import '../../styles/mes/mes.scss'
import '../../styles/mes/grafico-ventas-mensuales.scss'

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Todo se muestra en un unico total en pesos (los dolares se convierten
// con la tasa vigente) -- antes se mostraba "$ X + U$ Y" por separado, lo
// que quedaba confuso para la lectura rapida del resumen del mes.
const formatearMoneda = (pesos: number, dolares: number, tasaDolar: number) =>
  `$ ${(pesos + dolares * tasaDolar).toFixed(2)}`

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const hoy = new Date()

const Mes = () => {
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [resumen, setResumen] = useState<ResumenMes | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [semanasAbiertas, setSemanasAbiertas] = useState<Set<number>>(new Set([1]))
  const [historial, setHistorial] = useState<TotalMes[] | null>(null)
  const [diaEditando, setDiaEditando] = useState<DiaMes | null>(null)
  const tasaDolar = useTasaDolar()

  useEffect(() => {
    setCargando(true)
    setSemanasAbiertas(new Set([1]))
    getResumenMes(anio, mes)
      .then((data) => {
        setResumen(data)
        setError('')
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el resumen del mes.')))
      .finally(() => setCargando(false))
  }, [anio, mes])

  useEffect(() => {
    getHistorialMeses(6)
      .then((data) => setHistorial(data.meses))
      .catch(() => setHistorial(null))
  }, [])

  const alternarSemana = (numero: number) => {
    setSemanasAbiertas((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(numero)) {
        siguiente.delete(numero)
      } else {
        siguiente.add(numero)
      }
      return siguiente
    })
  }

  const irMesAnterior = () => {
    if (mes === 1) {
      setMes(12)
      setAnio((a) => a - 1)
    } else {
      setMes((m) => m - 1)
    }
  }

  const irMesSiguiente = () => {
    if (mes === 12) {
      setMes(1)
      setAnio((a) => a + 1)
    } else {
      setMes((m) => m + 1)
    }
  }

  const handleGuardarCierre = async (totalPesos: number, totalDolares: number) => {
    if (!diaEditando) return
    await editarCierreDia(diaEditando.fecha, totalPesos, totalDolares)
    setResumen((prev) => {
      if (!prev) return prev
      const semanas = prev.semanas.map((semana) => ({
        ...semana,
        dias: semana.dias.map((dia) =>
          dia.fecha === diaEditando.fecha ? { ...dia, totalPesos, totalDolares, cerrado: true } : dia
        ),
      }))
      const totalPesosMes = semanas.reduce(
        (sum, s) => sum + s.dias.reduce((sumDia, d) => sumDia + d.totalPesos, 0),
        0
      )
      const totalDolaresMes = semanas.reduce(
        (sum, s) => sum + s.dias.reduce((sumDia, d) => sumDia + d.totalDolares, 0),
        0
      )
      const semanasConTotales = semanas.map((semana) => ({
        ...semana,
        totalPesos: semana.dias.reduce((sum, d) => sum + d.totalPesos, 0),
        totalDolares: semana.dias.reduce((sum, d) => sum + d.totalDolares, 0),
      }))
      return { ...prev, semanas: semanasConTotales, totalPesos: totalPesosMes, totalDolares: totalDolaresMes }
    })
    setDiaEditando(null)
  }

  return (
    <div className="container mt-4 mes-container">
      <div className="mes-cabecera">
        <span className="mes-subtitulo">Mes</span>
        <div className="mes-selector">
          <button type="button" className="btn mes-btn-nav" onClick={irMesAnterior} aria-label="Mes anterior">
            ‹
          </button>
          <h2 className="mb-0 mes-titulo">{NOMBRES_MES[mes - 1]} {anio}</h2>
          <button type="button" className="btn mes-btn-nav" onClick={irMesSiguiente} aria-label="Mes siguiente">
            ›
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : resumen ? (
        <>
          <div className="mes-total-box">
            <span className="mes-total-label">Total del mes</span>
            <span className="mes-total-valor">{formatearMoneda(resumen.totalPesos, resumen.totalDolares, tasaDolar)}</span>
          </div>

          {resumen.semanas.map((semana) => {
            const abierta = semanasAbiertas.has(semana.numero)
            return (
              <div key={semana.numero} className="mes-semana">
                <button
                  type="button"
                  className="mes-semana-cabecera"
                  onClick={() => alternarSemana(semana.numero)}
                  aria-expanded={abierta}
                >
                  <span className="mes-semana-flecha">{abierta ? '▾' : '▸'}</span>
                  <h6 className="mb-0">Semana {semana.numero}</h6>
                  <span className="mes-semana-total">{formatearMoneda(semana.totalPesos, semana.totalDolares, tasaDolar)}</span>
                </button>

                {abierta && (
                  <table className="mes-tabla">
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th>Fecha</th>
                        <th className="text-end">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {semana.dias.map((dia) => (
                        <tr key={dia.fecha} className={dia.totalPesos === 0 && dia.totalDolares === 0 ? 'mes-fila-sin-ventas' : ''}>
                          <td>{capitalizar(dia.diaSemana)}</td>
                          <td>{dia.fecha.split('-').reverse().join('/')}</td>
                          <td className="text-end">{formatearMoneda(dia.totalPesos, dia.totalDolares, tasaDolar)}</td>
                          <td className="mes-fila-editar">
                            <button type="button" className="mes-btn-editar-dia" onClick={() => setDiaEditando(dia)}>
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </>
      ) : null}

      {historial && historial.some((m) => m.totalPesos > 0 || m.totalDolares > 0) && (
        <GraficoVentasMensuales meses={historial} />
      )}

      {diaEditando && (
        <EditarCierreDiaModal
          fecha={diaEditando.fecha}
          totalPesosActual={diaEditando.totalPesos}
          totalDolaresActual={diaEditando.totalDolares}
          onCancelar={() => setDiaEditando(null)}
          onGuardar={handleGuardarCierre}
        />
      )}
    </div>
  )
}

export default Mes
