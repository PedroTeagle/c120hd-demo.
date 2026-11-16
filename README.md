# c120hd-demo.

TEAGLE C120-HD PRODUCT PAGE: DEMO PROTOTYPE
============================================

A static HTML/CSS/JS prototype of the C120-HD Calibrator product page,
made to show the layout, content and interactions. It has no build step
and no dependencies: open index.html, or serve the folder from any web
server.


FILES
-----
index.html       Page markup, one commented block per section, in page order.
css/styles.css   All styling. Contents list at the top, then design tokens
                 (colours, type sizes, spacing), then one section per page block.
                 Colours: red plus one dark grey (#444), one mid grey (#ddd)
                 and one light grey (#f5f5f5). Type: five styles (H1, H2, H3,
                 body, button), each one token; small text matches the
                 button size. Add .h--plain to a heading to drop the
                 underline, .h--light for regular weight.
                 Each block's responsive rules sit directly under it.
js/main.js       Interactions, one self-contained module per feature
                 (contents list at the top).
images/          Photos, the 8 product angles (f1-f8.webp), icons and the
                 hero videos.
robots.txt       Asks search engines not to index the demo.


BREAKPOINTS (desktop first, max-width queries)
-----------
1800px and up    Large desktop, matches the 1920px design
1280-1799px      Laptop: sizes scale down smoothly between 1920 and 1440
1081-1279px      Small laptop: burger menu
701-1080px       Tablet: two-column sections stack
up to 700px      Mobile

Fluid sizes use clamp(). The middle value reads as "size at 1440px plus
growth per pixel above 1440px", e.g. calc(34px + (100vw - 1440px) * .02083)
is 34px at 1440 and 44px at 1920.

Content width is 84% of the viewport on desktop (the --wrap rule near the
top of styles.css). Delete that rule if the CMS sets its own container.


INTERACTIVE PARTS
-----------------
Product explorer   The 8 angle photos are stacked and one is shown at a
                   time. Feature text, hotspot positions, the best angle for
                   each feature and the photos are all in the FEATURES list
                   at the top of main.js; the list, hotspots and mobile pills
                   are generated from it.
                   Desktop/tablet: a feature list and hotspots; opening one
                   turns the machine to that feature's best angle and shows
                   a close-up card. Drag or use the arrow keys to rotate.
                   Mobile: pills under the machine. A pill grows into a
                   card over a full-size photo, with prev/next arrows and
                   swipe.
Gallery            Native horizontal scroll, with arrows and mouse drag.
Hero video         hero.mp4 (desktop) / hero-mobile.mp4 (phones). Not loaded
                   when the visitor prefers reduced motion; hero.jpg shows
                   until it plays. Pauses when scrolled out of view.
YouTube videos     The player only loads when play is pressed
                   (youtube-nocookie.com). The video id is the data-yt
                   attribute.
Contact form       A <dialog>, opened by any element with data-contact.
                   Client-side validation only.
Options and FAQ    Accordions. Options allow one open at a time.
Feature carousel   Rotor, grain milling hopper and quick switch hammers
                   (section 9 in main.js and section 8 in styles.css).
                   Arrows, dots, swipe or mouse drag anywhere on a slide,
                   sideways trackpad scroll and the arrow keys. Loops both ways using copies of the end
                   slides. No auto-play. Without JS the slides stack.


PERFORMANCE
-----------
- Photos are WebP in two sizes, chosen by the browser with srcset/sizes
  (gallery, review photo, rotor, the 8 machine angles: 800px for phones,
  1100px for larger screens). Every image has width and height set, so
  nothing shifts as it loads.
- Images below the first screen use loading="lazy". The 8 machine angles
  load up front so rotation never shows a gap.
- The mobile feature photos (p_*.jpg) are only fetched on phones, as the
  machine comes into view. Desktop close-ups (c_*.jpg) load when opened.
- The hero photo is preloaded, with a lighter version for phones
  (hero-mobile.jpg). The hero video starts after the page has loaded:
  hero.mp4 is 6.8MB (1920px), hero-mobile.mp4 2.7MB (960px). It is by far
  the largest download, so a smaller encode or a video host is worth
  considering for production.
- Set long cache lifetimes for images and video on the production server
  (GitHub Pages, used for the demo, only allows 10 minutes).
- CSS and JS are left unminified for readability; minify in the build.
- No web fonts: the page uses Helvetica Neue / Helvetica / Arial.


DEMO-ONLY, TO REPLACE FOR PRODUCTION
------------------------------------
- The contact form sends nothing. Connect it in the submit handler in
  main.js (section 6), and remove the "Demo page" line under the button
  (.modal__demo).
- noindex meta tag in index.html, and robots.txt.
- Navbar, footer, legal bar and their links are placeholders standing in
  for the site's own.
- The "Download PDF specification" link has no file yet.
- Finance terms and conditions were removed with the placeholder copy;
  add the approved wording if finance is promoted on the live page.
- Placeholder content still to confirm: the specification table figures
  (column still headed "C120 Calibrator"), and the icon strip values
  ("1" for the rotor, "200 HP").
- Feature carousel: the hopper and hammers icons are drawn placeholders,
  the hopper and hammers copy needs approving, and the hammers photo
  (c_hammers.jpg, 600px wide) is a stand-in for a proper shot.
