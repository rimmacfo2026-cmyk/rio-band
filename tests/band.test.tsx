import { expect, test } from 'claude-code/testing'

const BAND = (isWorking: boolean) =>
  ({
    plugin: 'rio-band',
    component: 'AbovePrompt',
    surface: 'desktop',
    props: { hasSurvey: false, isWorking, maxRows: 20, bodyColumns: 100, scroll: { offset: 0, bodyRows: 20 }, view: {} },
  }) as never

const svgOf = (node: unknown): string => JSON.stringify(node)

test('панорама показывает Thinking только во время работы и укладывается в лимит', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const working = await $.ui.mount(BAND(true))
  const busy = svgOf(await working.drawn())
  expect(busy).toContain('Thinking')
  expect(busy.length).toBeLessThan(131072)
  await working.unmount()

  const idle = await $.ui.mount(BAND(false))
  expect(svgOf(await idle.drawn()).includes('Thinking')).toBe(false)
  await idle.unmount()
})

test('цифры берутся из session.measure, на терминале панорамы нет', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('session.measure', ($, e) => ({ changed: e.changed }))

  await $.session.measure({
    context: { window: 200000, percent: 15 } as never,
    rateLimits: [
      { kind: 'five_hour', percentUsed: 1 },
      { kind: 'seven_day', percentUsed: 31 },
    ],
    changed: ['context'],
  })

  const ui = await $.ui.mount(BAND(false))
  const drawn = svgOf(await ui.drawn())
  expect(drawn).toContain('15%')
  expect(drawn).toContain('31%')
  await ui.unmount()

  const terminal = await $.ui.mount({ ...(BAND(false) as object), surface: 'terminal' } as never)
  expect(svgOf(await terminal.drawn())).toContain('engine')
  await terminal.unmount()
})
