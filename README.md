# Opportunity OS

Opportunity OS is a decision-support web app for evaluating opportunities against goals, current commitments, and available weekly capacity.

The core question:

> If I say yes to this opportunity, what am I saying no to?

## Status

This project is currently an MVP v0.2.

It is intentionally simple, local-first, and built for fast iteration. The product, UX, scoring logic, and data model will continue to change as the idea is tested and refined.

## Current Features

- Opportunity-first entry screen
- Goal planning
- Commitments attached to goals
- Weekly capacity tracking
- Review Later / Review Now opportunity workflow
- Opportunity inbox
- Opportunity review engine
- Flexible opportunity duration units
- Flexible time cost units with weekly impact normalization
- Dummy testing dataset loader
- Rule-based recommendation: Accept, Defer, or Reject
- Opportunity editing
- Local data persistence with `localStorage`
- Currency display for opportunity money cost

## How To Run

Open `index.html` directly in a browser.

No build step or backend is required for the current MVP.

## Project Files

- `index.html` - app structure
- `styles.css` - UI styling
- `app.js` - app state, rendering, calculations, and interactions
- `PRD_Opportunity_OS.md` - product requirements document

## MVP Limitations

- No backend yet
- No authentication yet
- No cloud sync yet
- No AI decision copilot yet
- No calendar integration yet
- Data is stored only in the browser using `localStorage`
- Recommendation logic is rule-based and will be improved over time

## Roadmap Ideas

- Edit flow for goals and commitments
- Better opportunity comparison
- Decision history and decision journal
- Export decision summary
- More advanced opportunity cost logic
- AI-assisted decision discussion
- Calendar and time tracking integrations

## Author

Gokong
