# Calendars, Seasons, and Moons

A secondary world with its own calendar needs one written record, or dates drift: a festival lands in two different months, a full moon rises twice in a week, the harvest comes before the thaw. Keep two records: the date decisions of record in `./book/metadata/timeline.md`, and a `## [Calendar]` section in `./book/knowledge/world-setting.md` for everything else (seasons, moons, holidays, how people tell time).

## Record the calendar

Ask the user for the month names and lengths in order, any days outside the months (festivals), the week if the story names weekdays, how years are counted, and how many hours a day has if not 24. Record it in `./book/metadata/timeline.md`:

```markdown
## Calendar

| Month | Days | Season | Notes |
|-------|------|--------|-------|
| Thaw | 30 | spring | Year begins at the first thaw |
| Sowing | 30 | spring | |
| ... | | | |
| Frost | 30 | winter | |
| Hollow Days | 5 | winter | Festival; not part of any month |

- **Weekdays:** Firstday, Seconday, Midweek, Fourthday, Fifthday, Restday
- **Eras:** Before the Founding (BF, counts backward), After the Founding (AF)
- **Hours per day:** 24 (or the world's own count)
```

- **Months** are listed in order, each with days. Festival days outside any month become a short month of their own (`Hollow Days`, 5 days). Every year is the sum of the months: no leap days.
- **Weekdays** are optional; note the weekday of a known date so later dates fall on the right day.
- **Eras** are optional. A backward era counts down toward the next one, as BC does. Note how long each forward era lasted.
- **Hours per day** is optional; note it when the world's day is not 24 hours, and record how people name the hours.

## Dating scenes

With a calendar, scene and chapter dates are written in it:

- `3 Thaw 412 AF`, or `3rd of Thaw, 412 After the Founding`
- `412-01-03 AF` (year, month number, day)
- `3 Thaw 412` (no era: the last era)
- `Seconday, 3 Thaw 412 AF` (a stated weekday must be the right one)

Record the time of day as `HH:MM` or a named part (`dawn`, `evening`). `/buchbinder timeline` and the continuity scan turn each date into a day count, so elapsed time across months, years, and eras is right. A date that starts with a digit or a weekday must be a real day of the calendar (`31 Thaw` in a 30-day month is an error). Other text (`the night of the fire`) is allowed, but nothing can order it, and the continuity scan warns about it.

## Seasons and daylight

Record for each season: day length, weather, what grows, what travel is possible (passes closed, rivers frozen or in flood), and what work people are doing. Route hours assume normal conditions; note seasonal exceptions in the location section.

## Moons and cycles

For each moon or cycle, record its period in days and one date when it was full (or at any fixed phase). The phase on day N is `(N - known full day) mod period`. Check any scene that mentions moonlight, tides, or a moon-bound ritual against this. Two moons align every least common multiple of their periods (29 and 41 days: every 1,189 days), which makes a good rare event.

## Checking

- `/buchbinder timeline` lists dated scenes in story-time order and flags scenes read after events that happen later.
- The continuity scan (`/buchbinder review`) checks clock order, travel hours, and routes. A named time is a span (`morning` covers the morning hours), an untimed scene spans its whole day, and only journeys impossible on every reading are errors.
