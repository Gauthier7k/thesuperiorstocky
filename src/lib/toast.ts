/** Tiny global toast bus — any code can pop a hype message, ToastLayer renders them. */

export interface ToastMsg {
  id: number
  text: string
}

type Listener = (toasts: ToastMsg[]) => void

let toasts: ToastMsg[] = []
let listener: Listener | null = null
let nextId = 1

export function subscribeToasts(fn: Listener): () => void {
  listener = fn
  fn(toasts)
  return () => {
    if (listener === fn) listener = null
  }
}

export function toast(text: string): void {
  const t: ToastMsg = { id: nextId++, text }
  toasts = [...toasts.slice(-2), t]
  listener?.(toasts)
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id)
    listener?.(toasts)
  }, 2600)
}

function pick(bank: string[]): string {
  return bank[Math.floor(Math.random() * bank.length)]
}

/* ---- hype banks: the app talking to you like a supportive friend ---- */

const HOT_PICK = [
  "{SYM}? That's a HOT stock 🔥",
  'Ooh {SYM} — spicy pick 🌶️',
  '{SYM} is SO hot right now 🥵',
]

const UP_PICK = [
  'Look at it GO 📈',
  "This one's cooking, chef 🧑‍🍳",
  'Green looks good on you 💚',
  'Great eye. Great taste. 👀',
]

const DOWN_PICK = [
  'On sale AND you looked? Smart 🧠',
  'Bargain hunting — respect 🤝',
  'Everyone loves a discount 🛍️',
]

const DOWN_INVERTED_PICK = [
  'Down? Never heard of it 🙃',
  'We fixed it for you 🔧',
  'Chart flipped. Mood saved. ✨',
]

const PROFIT = [
  'WOW you are doing SO good 👏',
  'Absolute legend behavior 🏆',
  "Someone's rich rich 💸",
  'Financial genius spotted 🧠✨',
]

const HOLDING_DIP = [
  'Diamond hands detected 💎🙌',
  "It's not a loss until you sell 😌",
  'Zoom out. Breathe. You got this 🧘',
]

const INVERTER_ON = ['Gravity: uninstalled 🙃', 'Sadness has been inverted ✨', 'Up only. As decreed. 📜']

const INVERTER_OFF = ['Back to reality. Brave. 🫡', 'Raw dogging the charts, huh 😳']

const TF_TURNED_GREEN = ['See? Zoom out — beautiful 😌', 'Time heals all charts 🕰️']

export const hype = {
  select(symbol: string, up: boolean, inverted: boolean, hot: boolean): string {
    const bank = hot ? HOT_PICK : up ? UP_PICK : inverted ? DOWN_INVERTED_PICK : DOWN_PICK
    return pick(bank).replaceAll('{SYM}', symbol)
  },
  profit: () => pick(PROFIT),
  holdingDip: () => pick(HOLDING_DIP),
  inverter: (on: boolean) => pick(on ? INVERTER_ON : INVERTER_OFF),
  turnedGreen: () => pick(TF_TURNED_GREEN),
}
