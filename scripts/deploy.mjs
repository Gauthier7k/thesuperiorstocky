/**
 * Deploy the built site to GitHub Pages.
 * Usage: npm run deploy   (runs the build first via the npm script)
 *
 * Pushes dist/ to the gh-pages branch through an in-repo worktree at
 * .gh-pages-tmp (gitignored). Pages serves that branch — pushing source to
 * main alone never updates the live site.
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const WT = '.gh-pages-tmp'
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

if (!existsSync('dist/index.html')) {
  console.error('dist/ missing — run the build first (npm run deploy does this for you).')
  process.exit(1)
}

// ensure the worktree exists (first run after a fresh clone)
if (!existsSync(join(WT, '.git'))) {
  run(`git worktree add ${WT} gh-pages`)
}

// replace worktree contents with the fresh build
for (const entry of readdirSync(WT)) {
  if (entry === '.git') continue
  rmSync(join(WT, entry), { recursive: true, force: true })
}
mkdirSync(WT, { recursive: true })
cpSync('dist', WT, { recursive: true })
writeFileSync(join(WT, '.nojekyll'), '')

run(`git -C ${WT} add -A`)
try {
  run(`git -C ${WT} commit -m "Deploy STOCKY build"`)
} catch {
  console.log('Nothing new to deploy — build identical to what is already live.')
  process.exit(0)
}
run(`git -C ${WT} push origin gh-pages`)
console.log('\nDeployed! Live in ~1 minute at https://gauthier7k.github.io/thesuperiorstocky/')
