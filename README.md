# cert-exam-prep

Interactive, browser-based mock exams for software testing and requirements engineering certifications. No login, no install, no backend — just open and start practicing.

## Live exams

**[→ Open the exam catalogue](https://YOUR-USERNAME.github.io/cert-exam-prep/)**

| Exam | Certification body | Questions | Points | Pass mark |
|---|---|---|---|---|
| [CT-GenAI Sample A](https://YOUR-USERNAME.github.io/certprep/istqb/ct-genai/istqb_ct_genai_mock_exam_v1.0.html) | ISTQB Specialist Level: Certified Tester – Testing with Generative AI (CT-GenAI) | 40 | 46 | 30 pts |
| [CT-GenAI Sample](https://YOUR-USERNAME.github.io/certprep/istqb/ct-genai/astqb_ct_genai_mock_exam.html) | ASTQB Certified Tester: Certified Tester – Testing with Generative AI (CT-GenAI) | 40 | 46 | 30 pts |

## Features

- ⏱ **Timed** — countdown timer with visual warnings at 15 min and 5 min remaining
- 🌐 **Language extension** — optional +15 min for non-native English speakers (ISTQB regulation)
- ✅ **Instant feedback** — answers revealed with colour coding and explanations after submission
- 📊 **Score summary** — points earned, correct/wrong/skipped, time used, pass/fail verdict
- 🔁 **Reset** — restart at any time without leaving the page
- 📱 **Responsive** — works on desktop, tablet and mobile

## Exam format

Questions are taken directly from the official sample exam PDFs published by the respective certification bodies. No question wording has been altered.

K-level and learning objective tags are shown on every question card. Two-point questions (K3) are clearly labelled.

## Adding a new exam

Each exam is a single self-contained `.html` file — no dependencies, no build step.

Suggested folder layout:

```
certprep/
├── index.html              ← landing page (catalogue)
├── istqb/
│   ├── ct-genai/
│   │   ├──  ct-genai-sample-a.html
│   │   ├──  ...
│   └── ...
└── cpre/
    └── ...
```

To add an exam, drop the HTML file into the appropriate folder and add a card to `index.html`.

## Deployment

The site is served via **GitHub Pages** from the `main` branch root. Any push to `main` is live within ~60 seconds.

Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`

## Disclaimer

This repository is an independent study aid. It is not affiliated with, endorsed by, or officially associated with ISTQB®, ASTQB, IREB, or any other certification body. All question content is sourced from publicly available sample exam documents published by those organisations. ISTQB® is a registered trademark of the International Software Testing Qualifications Board.
