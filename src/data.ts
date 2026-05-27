export const sample = {
  "repoName": "foxhen-debug-dungeon",
  "title": "Debug Dungeon",
  "subtitle": "A visual QA mini-game",
  "serviceLine": "Website bugfix game demo",
  "heroTitle": "Escape the dungeon by fixing UI bugs.",
  "heroCopy": "A browser mini-game where each room represents a common website defect: contrast failure, broken layout, missing CTA, and mobile overflow.",
  "primaryAction": "Start run",
  "secondaryAction": "Open bug log",
  "repositoryUrl": "https://github.com/foxandhenllc/foxhen-debug-dungeon",
  "liveDemoUrl": "https://freetoolsforpeople.com/debug-dungeon",
  "theme": {
    "accent": "#32306e",
    "accent2": "#ff9f6d",
    "ink": "#080716",
    "soft": "#efefff",
    "warm": "#fff0e7",
    "surface": "#fffaf4",
    "muted": "#5c667a",
    "border": "rgba(7, 18, 31, 0.12)"
  },
  "metrics": [
    {
      "label": "Rooms cleared",
      "value": "4",
      "note": "bug classes"
    },
    {
      "label": "Contrast score",
      "value": "AA",
      "note": "target"
    },
    {
      "label": "Escape time",
      "value": "18m",
      "note": "sample run"
    }
  ],
  "stages": [
    {
      "label": "Contrast Gate",
      "detail": "Select a readable CTA color before the gate opens.",
      "status": "ready",
      "owner": "Player",
      "index": 1
    },
    {
      "label": "Layout Pit",
      "detail": "Move cards into a responsive grid without clipping.",
      "status": "active",
      "owner": "Player",
      "index": 2
    },
    {
      "label": "CTA Torch",
      "detail": "Restore the missing action path before time expires.",
      "status": "waiting",
      "owner": "QA",
      "index": 3
    },
    {
      "label": "Mobile Door",
      "detail": "Fix overflow and exit with an acceptance report.",
      "status": "queued",
      "owner": "Studio",
      "index": 4
    }
  ],
  "workItems": [
    {
      "title": "Dim button",
      "detail": "Fails contrast until repaired",
      "status": "ready"
    },
    {
      "title": "Broken grid",
      "detail": "Cards overflow at tablet size",
      "status": "active"
    },
    {
      "title": "Lost CTA",
      "detail": "Waiting for correct label",
      "status": "waiting"
    },
    {
      "title": "Exit memo",
      "detail": "Queued after final room",
      "status": "queued"
    }
  ],
  "deliverables": [
    {
      "title": "Playable QA metaphor",
      "detail": "A memorable way to explain bugfix work."
    },
    {
      "title": "Defect taxonomy",
      "detail": "Common site defects mapped to acceptance checks."
    },
    {
      "title": "Score report",
      "detail": "A mock closeout summary after all fixes are found."
    }
  ],
  "timeline": [
    {
      "time": "Room 1",
      "detail": "Fix contrast and unlock confidence"
    },
    {
      "time": "Room 2",
      "detail": "Repair responsive layout"
    },
    {
      "time": "Room 3",
      "detail": "Restore conversion path and escape"
    }
  ],
  "proof": [
    "A public portfolio piece that makes QA work feel tangible.",
    "Shows interactivity and visual taste without real customer code.",
    "Designed as a lightweight browser game."
  ]
} as const;

export type StageStatus = "ready" | "active" | "waiting" | "queued";
export type DemoStage = (typeof sample.stages)[number];
export type WorkItem = (typeof sample.workItems)[number];
