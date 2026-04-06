import * as XLSX from 'xlsx'
import { writeFileSync } from 'fs'

// ── Configuración editable ──────────────────────────────────────────────────
const TARIFAS = {
  AP:  { hora: 15000, label: 'Médico AP' },
  MDT: { hora: 18000, label: 'Médico MDT' },
  TMT: { hora: 20000, label: 'Médico TMT' },
}

const SEMANAS_MES = 4.33
const COLACION_MIN = 30  // descontada del tiempo pagado

// Médicos de ejemplo (reemplazar con datos reales)
const MEDICOS = [
  { nombre: 'Dra. García',  categoria: 'AP',  horario: { lun:'08:00-17:00', mar:'08:00-17:00', mie:'08:00-17:00', jue:'08:00-17:00', vie:'08:00-17:00', sab:'', dom:'' } },
  { nombre: 'Dr. López',    categoria: 'AP',  horario: { lun:'08:00-17:00', mar:'08:00-17:00', mie:'08:00-17:00', jue:'08:00-17:00', vie:'08:00-17:00', sab:'', dom:'' } },
  { nombre: 'Dra. Ruiz',    categoria: 'MDT', horario: { lun:'08:00-17:00', mar:'08:00-17:00', mie:'08:00-17:00', jue:'08:00-17:00', vie:'08:00-17:00', sab:'', dom:'' } },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
function horasNetas(rangoHorario) {
  if (!rangoHorario) return 0
  const [ini, fin] = rangoHorario.split('-')
  if (!ini || !fin) return 0
  const [h1, m1] = ini.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1)
  return Math.max(0, (totalMin - COLACION_MIN) / 60)
}

function horasSemanales(horario) {
  return Object.values(horario).reduce((sum, rango) => sum + horasNetas(rango), 0)
}

// ── Estilos ─────────────────────────────────────────────────────────────────
const S = {
  titulo:     { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1e3a5f' } }, alignment: { horizontal: 'center' } },
  cabecera:   { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563eb' } }, alignment: { horizontal: 'center' } },
  subheader:  { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '475569' } } },
  categoria:  { font: { bold: true, color: { rgb: '1e3a5f' } }, fill: { fgColor: { rgb: 'dbeafe' } } },
  numero:     { numFmt: '#,##0', alignment: { horizontal: 'right' } },
  moneda:     { numFmt: '"$"#,##0', alignment: { horizontal: 'right' } },
  monedaNeg:  { numFmt: '"$"#,##0', alignment: { horizontal: 'right' }, font: { bold: true } },
  total:      { numFmt: '"$"#,##0', font: { bold: true }, fill: { fgColor: { rgb: 'fef9c3' } }, alignment: { horizontal: 'right' } },
  bold:       { font: { bold: true } },
  center:     { alignment: { horizontal: 'center' } },
  borde:      { border: { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} } },
}

function cell(v, style = {}) {
  return { v, s: style }
}

// ── Hoja 1: Resumen Ejecutivo ────────────────────────────────────────────────
function hoja1_resumen(wb) {
  const ws = {}
  const merges = []
  let row = 1

  const set = (c, r, v, s) => { ws[`${c}${r}`] = cell(v, s) }
  const merge = (s, e) => merges.push({ s, e })

  // Título
  set('A', row, 'PRESUPUESTO DE DOTACIÓN MÉDICA', S.titulo)
  merge({ r: row-1, c: 0 }, { r: row-1, c: 5 })
  row++
  set('A', row, 'Centro Médico — Resumen Ejecutivo', { ...S.titulo, font: { sz: 11, color: { rgb: 'FFFFFF' } } })
  merge({ r: row-1, c: 0 }, { r: row-1, c: 5 })
  row += 2

  // Cabecera tabla resumen
  for (const [i, h] of ['Categoría','Médicos','Hrs/semana','Hrs/mes','Costo/hora','Costo mensual'].entries()) {
    ws[`${String.fromCharCode(65+i)}${row}`] = cell(h, S.cabecera)
  }
  row++

  let totalMensual = 0
  for (const [cat, { hora, label }] of Object.entries(TARIFAS)) {
    const medicos = MEDICOS.filter(m => m.categoria === cat)
    const hrsSem = medicos.reduce((s, m) => s + horasSemanales(m.horario), 0)
    const hrsMes = hrsSem * SEMANAS_MES
    const costoMes = hrsMes * hora
    totalMensual += costoMes

    set('A', row, label,    S.categoria)
    set('B', row, medicos.length, S.numero)
    set('C', row, +hrsSem.toFixed(1), S.numero)
    set('D', row, +hrsMes.toFixed(1), S.numero)
    set('E', row, hora,     S.moneda)
    set('F', row, +costoMes.toFixed(0), S.moneda)
    row++
  }

  // Totales
  set('A', row, 'TOTAL MENSUAL', { ...S.bold, fill: { fgColor: { rgb: 'fef9c3' } } })
  merge({ r: row-1, c: 0 }, { r: row-1, c: 4 })
  set('F', row, +totalMensual.toFixed(0), S.total)
  row++
  set('A', row, 'TOTAL ANUAL (x12)', { ...S.bold, fill: { fgColor: { rgb: 'fed7aa' } } })
  merge({ r: row-1, c: 0 }, { r: row-1, c: 4 })
  set('F', row, +(totalMensual * 12).toFixed(0), { ...S.total, fill: { fgColor: { rgb: 'fed7aa' } } })
  row += 2

  // Nota
  set('A', row, `* Colación descontada: ${COLACION_MIN} min/día | Semanas/mes: ${SEMANAS_MES}`, { font: { italic: true, sz: 9, color: { rgb: '6b7280' } } })
  merge({ r: row-1, c: 0 }, { r: row-1, c: 5 })

  ws['!merges'] = merges
  ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
}

// ── Hoja 2: Dotación detallada ───────────────────────────────────────────────
function hoja2_dotacion(wb) {
  const ws = {}
  const merges = []
  let row = 1

  const set = (c, r, v, s) => { ws[`${c}${r}`] = cell(v, s) }
  const cols = ['A','B','C','D','E','F','G','H','I','J','K','L']

  // Título
  set('A', row, 'DOTACIÓN MÉDICA — DETALLE DE HORAS Y COSTOS', S.titulo)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } })
  row += 2

  const headers = ['Nombre','Categoría','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo','Hrs/sem','Hrs/mes','Costo mensual']
  headers.forEach((h, i) => { ws[`${cols[i]}${row}`] = cell(h, S.cabecera) })
  row++

  for (const [cat, { hora, label }] of Object.entries(TARIFAS)) {
    const medicos = MEDICOS.filter(m => m.categoria === cat)
    if (medicos.length === 0) continue

    // Fila de categoría
    set('A', row, label, S.categoria)
    merges.push({ s: { r: row-1, c: 0 }, e: { r: row-1, c: 11 } })
    row++

    for (const m of medicos) {
      const { lun, mar, mie, jue, vie, sab, dom } = m.horario
      const hrsSem = horasSemanales(m.horario)
      const hrsMes = hrsSem * SEMANAS_MES
      const costo = hrsMes * hora

      set('A', row, m.nombre)
      set('B', row, label)
      set('C', row, lun || '—', S.center)
      set('D', row, mar || '—', S.center)
      set('E', row, mie || '—', S.center)
      set('F', row, jue || '—', S.center)
      set('G', row, vie || '—', S.center)
      set('H', row, sab || '—', S.center)
      set('I', row, dom || '—', S.center)
      set('J', row, +hrsSem.toFixed(1), S.numero)
      set('K', row, +hrsMes.toFixed(1), S.numero)
      set('L', row, +costo.toFixed(0), S.moneda)
      row++
    }
  }

  ws['!merges'] = merges
  ws['!cols'] = [
    { wch: 20 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Dotación')
}

// ── Hoja 3: Tarifas configurables ───────────────────────────────────────────
function hoja3_tarifas(wb) {
  const data = [
    ['CONFIGURACIÓN DE TARIFAS Y PARÁMETROS'],
    [],
    ['Categoría', 'Tarifa por hora ($)', 'Descripción'],
    ...Object.entries(TARIFAS).map(([k, v]) => [v.label, v.hora, `Costo hora para ${v.label}`]),
    [],
    ['PARÁMETROS GENERALES'],
    ['Semanas por mes', SEMANAS_MES, 'Promedio de semanas en un mes'],
    ['Colación (min)',  COLACION_MIN, 'Minutos descontados por colación diaria'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Tarifas')
}

// ── Generar archivo ──────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new()
hoja1_resumen(wb)
hoja2_dotacion(wb)
hoja3_tarifas(wb)

const outPath = './presupuesto-dotacion-medica.xlsx'
writeFileSync(outPath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
console.log(`✓ Archivo generado: ${outPath}`)
