# GEMINI.md - Behavior Rules

This document outlines the strict behavioral rules for Gemini CLI during the development of SUDOKUPADO.

## Rules

1.  **Regression Testing Mandatory:** For every bug reported by the user, a corresponding regression test MUST be created in the `src/test/` directory. This test must specifically reproduce the reported failure and verify its fix to prevent future regressions.
2.  **English Technical Artifacts:** All source code, variable names, functions, interfaces, inline comments, documentation, and tests MUST be written strictly in English.
3.  **Castilian Spanish Communication:** All conversational interactions and explanations with the user MUST be in Castilian Spanish.
4.  **Design System Adherence:** All UI changes MUST strictly follow the rules defined in `DESIGN.md`.
5.  **Versioning (SemVer):** The project uses Semantic Versioning for Git tags.
    *   **MAJOR:** Backward-incompatible, drastic changes.
    *   **MINOR:** New features that are backward-compatible.
    *   **PATCH:** Bug fixes that are backward-compatible.
6.  **Version Tagging Condition:** ONLY create a new version tag (e.g., `v1.0.0`) when there are real, functional changes to the game (e.g., source code). Changes exclusively to meta-files, documentation, or tools like `GEMINI.md` DO NOT warrant a new version tag.
7.  **Version Tagging Authorization:** NEVER create a version tag without PRIOR EXPLICIT CONFIRMATION from the user. Once confirmed, the authorization IMPLICITLY includes permission to push both the `main` branch and the new tag to the remote repository to trigger deployment.
8.  **Pre-Tagging Workflow:** Before creating a version tag, all changes MUST be committed using the Conventional Commits standard.
9.  **Version Bumping Rule:** When updating the project version, ALWAYS use the `npm version <type> --no-git-tag-version` (or specify the exact version) command. This ensures both `package.json` and `package-lock.json` are synchronized. DO NOT update `package.json` manually. BEFORE bumping the version, you MUST run locally `make check` to ensure no broken code is tagged.
10. **Backlog & Technical Debt:** ANY pending feature, non-critical bug, or technical debt MUST be recorded in the `TODO.md` file (ignored by Git) to keep the conversational context and the project guidelines clean.
11. **User Consultation Options:** When using the `ask_user` tool with the `choice` type, ALWAYS provide at least 3 distinct options. Additionally, ALWAYS explicitly state which option is recommended and provide a brief technical justification for that recommendation.
12. **Commit Messages:** Conventional Commits MUST clearly and technically explain the changes made and the value they add. NEVER mention "TODO", "backlog", or refer to task lists in the commit message.
13. **TODO.md Protection:** The `TODO.md` file MUST NEVER be staged or committed to the repository. It is for local task tracking only.

