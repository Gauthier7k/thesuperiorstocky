/** Tiny global toast bus — any code can pop a hype message, ToastLayer renders them. */

export type ToastVariant = 'default' | 'win' | 'flip' | 'chill'

export interface ToastMsg {
  id: number
  text: string
  variant: ToastVariant
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

export function toast(text: string, variant: ToastVariant = 'default'): void {
  const t: ToastMsg = { id: nextId++, text, variant }
  toasts = [...toasts.slice(-2), t]
  listener?.(toasts)
  const duration = variant === 'win' ? 3400 : 2600
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id)
    listener?.(toasts)
  }, duration)
}

function pick(bank: string[]): string {
  return bank[Math.floor(Math.random() * bank.length)]
}

/* ---- hype banks: the app talking to you like a supportive friend ---- */

const HOT_PICK = [
  "{SYM}? That's a HOT stock 🔥",
  'Ooh {SYM} — spicy pick 🌶️',
  '{SYM} is SO hot right now 🥵',
  '{SYM} just got chosen. Lucky you ✨',
  'Main character stock energy 🎬',
]

const UP_PICK = [
  'Look at it GO 📈',
  "This one's cooking, chef 🧑‍🍳",
  'Green looks good on you 💚',
  'Great eye. Great taste. 👀',
  'WAGMI vibes only 🚀',
  'Certified up-only behavior 📈',
]

const DOWN_PICK = [
  'On sale AND you looked? Smart 🧠',
  'Bargain hunting — respect 🤝',
  'Everyone loves a discount 🛍️',
  'Buy low, brag later 😎',
  'Future you is gonna thank you 🙏',
]

const DOWN_INVERTED_PICK = [
  'Down? Never heard of it 🙃',
  'We fixed it for you 🔧',
  'Chart flipped. Mood saved. ✨',
  'Reality is optional here 🌀',
  'Upside-down is still UP 🙃',
]

const PROFIT = [
  'WOW you are doing SO good 👏',
  'Absolute legend behavior 🏆',
  "Someone's rich rich 💸",
  'Financial genius spotted 🧠✨',
  'PRINTING. ACTUAL PRINTING. 🖨️💰',
  'Portfolio said thank you 🙏',
  'Chef kiss on that entry 👨‍🍳💋',
]

const HOLDING_DIP = [
  'Diamond hands detected 💎🙌',
  "It's not a loss until you sell 😌",
  'Zoom out. Breathe. You got this 🧘',
  'Temporary discount. Permanent conviction 💪',
  'Legends buy the dip 🛒',
]

const INVERTER_ON = [
  'Gravity: uninstalled 🙃',
  'Sadness has been inverted ✨',
  'Up only. As decreed. 📜',
  'Physics left the chat 🚪',
  'Reality.exe has stopped 🌀',
]

const INVERTER_OFF = [
  'Back to reality. Brave. 🫡',
  'Raw dogging the charts, huh 😳',
  'Courage mode: activated 🦁',
]

const TF_TURNED_GREEN = [
  'See? Zoom out — beautiful 😌',
  'Time heals all charts 🕰️',
  'Patience pays. Literally. 💚',
  'Green era unlocked 🎉',
]

const FIRST_SHARE = [
  'Bag secured 🎯',
  'You officially own a piece 🏠',
  'Welcome to the club 🤝',
  'Position opened. Vibes: immaculate ✨',
]

const MILESTONE = [
  '${n} club — you made it 🎊',
  '${n} and counting 📈',
  'Level ${n} unlocked 🏅',
  '${n}? Built different 💪',
]

const NEWS_CLICK = [
  'Doing your research 📚',
  'Due diligence king/queen 👑',
  'Big brain energy 🧠',
  'Homework: done ✅',
]

export const hype = {
  select(symbol: string, up: boolean, inverted: boolean, hot: boolean): string {
    const bank = hot ? HOT_PICK : up ? UP_PICK : inverted ? DOWN_INVERTED_PICK : DOWN_PICK
    return pick(bank).replaceAll('{SYM}', symbol)
  },
  profit: () => pick(PROFIT),
  holdingDip: () => pick(HOLDING_DIP),
  inverter: (on: boolean) => pick(on ? INVERTER_ON : INVERTER_OFF),
  turnedGreen: () => pick(TF_TURNED_GREEN),
  firstShare: () => pick(FIRST_SHARE),
  milestone: (n: number) => pick(MILESTONE).replaceAll('${n}', `$${n.toLocaleString()}`),
  newsClick: () => pick(NEWS_CLICK),
}
