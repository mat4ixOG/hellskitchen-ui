# Videos

Files dropped here are served from the site root, e.g. `public/videos/hero.mp4`
is requested as `videos/hero.mp4`.

| File                 | Where it shows            | Suggested clip                          |
|----------------------|---------------------------|-----------------------------------------|
| `hero.mp4`           | Hero background (25% op.) | Abstract dark motion, slow, loopable    |
| `reel-overview.mp4`  | Motion section, reel 1    | Screen recording — install to first use |
| `reel-motion.mp4`    | Motion section, reel 2    | Transitions, slowed down                |
| `reel-theming.mp4`   | Motion section, reel 3    | Token edits retheming the UI live       |

Matching `.jpg` posters (same basename) are used as the poster frame.

Every slot degrades on its own: if the file is missing the `(error)` handler
swaps in an animated placeholder, so nothing breaks while the folder is empty.

Free, commercially usable stock footage:
- pexels.com/videos
- coverr.co
- mixkit.co/free-stock-video

Keep hero clips under ~4 MB — it loads on first paint. `preload="metadata"`
is already set on every player.
