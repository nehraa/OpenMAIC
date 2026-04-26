# Contributing to Aidutech Classroom

Thank you for your interest in contributing to the Aidutech Classroom product.

## Repository Rule (Phase 1)

The `/core` directory is the sacred baseline from OpenMAIC and must remain untouched during Phase 1 development.

**Why:** Phase 1 builds teacher and student products by copying/adapting code from core into `/teacher` and `/student`.

**How to handle bugs in core:** File an issue, get approval before modifying core.

**Copy-on-write policy:** If you need functionality from core, copy it to teacher/student and adapt there. Never modify core directly.

## Getting Started

1. Clone the repository
2. Create a feature branch from `main`
3. Make your changes in `/teacher` or `/student` directories
4. Submit a pull request for review

## Development Guidelines

- All Phase 1 development must occur in `/teacher` and `/student` directories
- Use the CI workflow to validate your changes
- Run tests before submitting pull requests