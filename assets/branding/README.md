# Social platform marks

`src/assets/platformMarks.ts` contains the unchanged Instagram, YouTube, Twitch
and X (x-twitter) SVG paths from **Font Awesome Free 6.7.2**, by Fonticons, Inc.

- Source: <https://github.com/FortAwesome/Font-Awesome/tree/6.7.2/svgs/brands>
- License for these SVG icons: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
- License record: <https://github.com/FortAwesome/Font-Awesome/blob/6.7.2/LICENSE.txt>

The app changes only colour and framing: Instagram uses a saturated
orange/pink/purple/indigo gradient, YouTube uses red, Twitch uses purple and X
uses black. All four marks share a white tile, 70% inner footprint and 24%
corner radius in both themes. Each mark colour and gradient stop has at least
3:1 graphical contrast against its tile. The palette is shared with the live
review in `src/assets/platformMarkPresentation.ts`.

No extra font, native package or network request
is required for rendering. Readable attribution and source/license links also
ship in **Help → About Dreams**. Stored game platform IDs retain their earlier names for save
compatibility; visible names identify Instagram, YouTube, Twitch and X.
