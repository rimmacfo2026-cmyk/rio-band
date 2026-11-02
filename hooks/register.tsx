import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Meters } from '../types'

// Панорама Рио над полем ввода: солнце, Сахарная голова с канаткой, пляж Копакабаны
// и маскот Claude с бантиком. Цифры context, 5h и 7d дает сам Claude Code.

const meters = atom({ plugin: 'rio-band', key: 'meters' } as const, { context: null, fiveHour: null, sevenDay: null } as Meters)

const C = {
  sky: ['#4FB8F0', '#86D2F5', '#C8ECF8'],
  sun: '#FFD83D',
  ray: '#FFC400',
  far: '#5FA878',
  hill: '#2F7D54',
  rock: '#5E6E66',
  city: '#E9E2D6',
  win: '#4F7FA8',
  off: '#B9AFA0',
  sea: '#1E9BC7',
  foam: '#FFFFFF',
  sand: '#F5DFA8',
  wa: '#222222',
  wb: '#FFFFFF',
  palm: '#1E6B45',
  cloud: '#FFFFFF',
  text: '#123A5A',
  ring: '#FF7AC6',
  track: '#4A4458',
  pink: '#FF3D9A',
  pinkSoft: '#FFD1F0',
}

const R = (x: number, y: number, w: number, h: number, c: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`

const drift = (inner: string, d: number, dur: number) =>
  `<g><animateTransform attributeName="transform" type="translate" values="0 0;${d} 0;0 0" dur="${dur}s" repeatCount="indefinite"/>${inner}</g>`

const MASCOT = [
  '...BB..BB...',
  '...BBDDBB...',
  '...BB..BB...',
  '..CCCCCCCC..',
  '..CECCCCEC..',
  '..CECCCCEC..',
  'CCCCCCCCCCCC',
  'CCCCCCCCCCCC',
  '..CCCCCCCC..',
  '..C.C..C.C..',
  '..C.C..C.C..',
]
const MASCOT_COLORS: Record<string, string> = { B: C.pink, D: '#B5126B', C: '#E8896F', E: '#1B0F3F' }

const mascot = (x: number, y: number, u: number) => {
  let o = ''
  MASCOT.forEach((row, j) => {
    ;[...row].forEach((k, i) => {
      const color = MASCOT_COLORS[k]
      if (color) o += R(x + i * u, y + j * u, u, u, color)
    })
  })
  return o
}

const palm = (x: number) => {
  let o = ''
  for (let i = 0; i < 14; i++) o += R(x + Math.round((i * i) / 40), 84 - i * 2, 3, 2, C.palm)
  const tx = x + 5
  const ty = 56
  return (
    o +
    R(tx - 10, ty, 22, 2, C.palm) +
    R(tx - 14, ty + 2, 6, 2, C.palm) +
    R(tx + 10, ty + 2, 6, 2, C.palm) +
    R(tx - 6, ty - 2, 14, 2, C.palm) +
    R(tx - 16, ty + 4, 3, 2, C.palm) +
    R(tx + 15, ty + 4, 3, 2, C.palm)
  )
}

/** Вся картина, кроме маскота: она не меняется, поэтому считается один раз. */
const backdrop = (() => {
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

  let o = R(0, 0, 680, 30, C.sky[0]!) + R(0, 30, 680, 20, C.sky[1]!) + R(0, 50, 680, 18, C.sky[2]!)

  let rays = ''
  for (let a = 0; a < 8; a++) {
    const t = (a * Math.PI) / 4
    rays += R(Math.round(268 + Math.cos(t) * 19) - 2, Math.round(26 + Math.sin(t) * 19) - 2, 4, 4, C.ray)
  }
  o += `<g>${rays}<animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/></g>`
  for (let a = -13; a <= 13; a += 2) for (let b = -13; b <= 13; b += 2) if (a * a + b * b <= 169) o += R(268 + a, 26 + b, 2, 2, C.sun)

  o += drift(R(175, 12, 26, 4, C.cloud) + R(183, 8, 12, 4, C.cloud), 24, 14)
  o += drift(R(560, 18, 30, 4, C.cloud) + R(570, 14, 14, 4, C.cloud), -26, 18)
  o += drift(R(345, 10, 20, 3, C.cloud), 18, 16)
  o += R(320, 18, 2, 2, C.palm) + R(322, 20, 2, 2, C.palm) + R(324, 18, 2, 2, C.palm)
  o += R(334, 26, 2, 2, C.palm) + R(336, 28, 2, 2, C.palm) + R(338, 26, 2, 2, C.palm)

  o += R(0, 68, 680, 16, C.sea)
  for (let x = 0; x < 350; x += 4) {
    const h = Math.round((20 + 14 * Math.sin(x / 38) + 8 * Math.sin(x / 15)) / 2) * 2
    o += R(x, 74 - h, 4, h + 10, C.far)
  }
  for (let x = 0; x <= 220; x += 3) {
    const g = Math.exp(-((x - 105) * (x - 105)) / (2 * 42 * 42))
    const h = Math.round(54 * g + 6 * Math.sin(x / 9) * g + Math.exp(-((x - 178) * (x - 178)) / (2 * 22 * 22)) * 22)
    o += R(x, 84 - h, 3, h, C.hill)
  }
  for (let x = 190; x < 322; x += 11) {
    const h = 10 + Math.floor(rnd() * 18)
    o += R(x, 84 - h, 10, h, C.city)
    for (let y = 84 - h + 2; y < 82; y += 5) {
      o += R(x + 2, y, 2, 2, rnd() > 0.35 ? C.win : C.off) + R(x + 6, y, 2, 2, rnd() > 0.35 ? C.win : C.off)
    }
  }
  for (let x = 336; x < 396; x += 2) {
    const t = (x - 365) / 30
    const h = Math.round(18 * Math.pow(1 - t * t, 0.6))
    o += R(x, 74 - h, 2, h, C.hill)
  }
  for (let x = 392; x <= 498; x += 2) {
    const t = (x - 445) / 54
    const h = Math.round(50 * Math.pow(1 - Math.pow(Math.abs(t), 2.4), 0.75))
    o += R(x, 74 - h, 2, h, C.rock)
  }
  for (let i = 0; i <= 26; i++) o += R(372 + i * 3, Math.round(56 - i * 1.1), 3, 1, C.palm)
  o += `<g>${R(-4, 1, 8, 5, C.pink)}${R(-1, -1, 2, 2, C.palm)}<animateMotion path="M374 57 L448 28 L374 57" dur="9s" repeatCount="indefinite"/></g>`
  for (let i = 0; i < 7; i++) o += drift(R(340 + i * 48, 70 + (i % 3) * 5, 16, 1, C.foam), i % 2 ? 10 : -10, 3 + (i % 3))

  o += R(0, 84, 680, 16, C.sand)
  for (let x = 0; x < 680; x += 4) {
    const y = 95 + Math.round(2 * Math.sin(x / 8))
    o += R(x, 93, 4, 7, C.wb) + R(x, y, 4, 3, C.wa)
  }
  o += palm(226) + palm(636) + palm(30)
  o += R(518, 66, 2, 18, C.palm) + R(506, 64, 26, 2, C.pink) + R(510, 62, 18, 2, C.pinkSoft) + R(515, 60, 8, 2, C.pink)
  return o
})()

const panorama = (isWorking: boolean) => {
  const label = isWorking
    ? `<text x="566" y="46" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="12" font-weight="500" fill="${C.text}">Thinking<tspan>.<animate attributeName="opacity" values="0;1;1;0" dur="1.6s" repeatCount="indefinite"/></tspan></text>`
    : ''
  const bob = isWorking
    ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur=".9s" repeatCount="indefinite"/>'
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" style="display:block">${backdrop}${label}<g>${bob}${mascot(572, 51, 3)}</g></svg>`
}

const ring = (percent: number) => {
  const r = 8
  const len = 2 * Math.PI * r
  const used = (len * Math.max(0, Math.min(100, percent))) / 100
  return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="${r}" fill="none" stroke="${C.track}" stroke-width="2.5"/><circle cx="11" cy="11" r="${r}" fill="none" stroke="${C.ring}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${used} ${len}" transform="rotate(-90 11 11)"/></svg>`
}

const pick = (limits: SessionRateLimit[], kind: string) => limits.find(l => l.kind === kind)?.percentUsed ?? null

const measure = ($: EngineInterface, context: SessionContextUsage, rateLimits: SessionRateLimit[]) =>
  update($, meters, () => ({
    context: context.percent ?? null,
    fiveHour: pick(rateLimits, 'five_hour'),
    sevenDay: pick(rateLimits, 'seven_day'),
  }))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const { context, rateLimits } = await $.session.usage()
    await measure($, context, rateLimits)
    return result
  })

  on('session.measure', async ($, e, next) => {
    await measure($, e.context, e.rateLimits)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // В терминале нет элемента Svg: там панораму не рисуем и не мешаем.
    if (e.props.hasSurvey || e.surface === 'terminal') return next(e)

    const { Box, Svg, Text } = $.ui.resolve(e)
    const now = await read($, meters)
    const rows: [string, number | null][] = [
      ['context', now.context],
      ['5h', now.fiveHour],
      ['7d', now.sevenDay],
    ]

    return (
      <Box flexDirection="column" alignItems="center" gap={1}>
        <Box flexDirection="row" justifyContent="center" gap={4}>
          {rows.flatMap(([name, value]) =>
            value === null
              ? []
              : [
                  <Box key={name} flexDirection="row" alignItems="center" gap={1}>
                    <Svg key={`ring-${name}`} source={ring(value)} alt={`${name}: ${Math.round(value)}%`} width={22} height={22} />
                    <Text bold>{Math.round(value)}%</Text>
                    <Text dimColor>{name}</Text>
                  </Box>,
                ],
          )}
        </Box>
        <Svg
          key="rio"
          source={panorama(e.props.isWorking)}
          alt={e.props.isWorking ? 'Рио: маскот с бантиком думает' : 'Рио: маскот с бантиком отдыхает'}
          width={680}
          height={100}
          isInteractive
        />
      </Box>
    )
  })
}
