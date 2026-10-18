# Maps and Routes

A story map is a graph before it is a picture: which places connect, how long the journey takes, and by what means. Record that graph in the location sections so the continuity scan can check travel against the timeline.

## Recording routes

Add a Routes block to a location's section in `./book/knowledge/locations.md`, one entry per direct connection:

```markdown
- **Routes:**
  - to: saltmarsh-fort — 9 hours coach
  - to: the-narrows — 4 hours boat
```

- `to` — the name of another location in `locations.md`.
- `hours` — travel time as a number (decimals allowed: `0.5` is thirty minutes).
- `mode` — free text: `on foot`, `horse`, `coach`, `river barge`, `airship`.

Routes are two-way unless the other location declares its own route back. Declare the return route only when it differs: against the current, uphill, or slower in a season (note the season in the location body).

Record only direct connections. A journey through an intermediate place is two routes, which lets the map show the waypoint.

## Setting plausible hours

Measure distance on the user's map or a real map, then divide by the speed for the mode (see the travel speeds table in `economy-logistics.md`). Add time for rests, border crossings, changing horses, tides, and weather. Real settings deserve a research note: walk the route or check a journey planner, then record the source in `./book/research/`.

## Reading the route network

List the locations and their routes and read them for:

- Isolated locations with no routes (fine for a far-off place only mentioned, suspicious for one characters visit)
- Shortcuts that make a set-piece journey pointless
- Hubs that should be politically or economically important but are not treated that way in the world notes

Keep the list current as routes change.

## The continuity travel check

The continuity scan (`/buchbinder review`, `/buchbinder timeline`) uses routes together with scene dates, times, and locations, and the scene's characters and POV. When a character appears in two dated scenes at locations linked by routes, and the story time between the scenes is less than the fastest route (possibly through other places), it reports an error: the character could not have made the trip. A named time covers a span, and a scene with a date but no time spans its whole day. The gap is taken at its most generous reading, so only a journey impossible on every reading is an error. A character at two different places at the same exact time is an error even with no route between them.

To fix a finding:

1. Move the later scene's date or time later.
2. Change the route's mode and hours if a faster means exists in the story — and show that means on the page.
3. Remove the character from one scene's characters (list them as only referred to if they are not on the page).
