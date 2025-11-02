# Contributing to NgSearch

Thank you for your interest in contributing! This guide describes how to set up your environment, structure your work, and collaborate effectively on this project.

## Environment Setup

1. **Node.js and npm**
   - Install [Node.js](https://nodejs.org/) version 20.x or later. The matching npm version is installed automatically.
   - Confirm your versions:
     ```bash
     node --version
     npm --version
     ```
2. **Install dependencies**
   - From the repository root, install dependencies with:
     ```bash
     npm install
     ```
3. **Run the application**
   - Start the local dev server to verify your setup:
     ```bash
     npm start
     ```
   - Open `http://localhost:4200/` in your browser. The Angular CLI automatically reloads the app when files change.
4. **Run tests**
   - Execute unit tests with:
     ```bash
     npm test
     ```
   - Run end-to-end tests (if configured) with:
     ```bash
     npm run e2e
     ```

## Branching Strategy

- Create feature branches from the `main` branch using a descriptive name, e.g., `feature/add-search-filter` or `fix/handle-empty-query`.
- Keep branches focused on a single change to simplify reviews.
- Rebase your branch on top of the latest `main` before opening a pull request.

## Commit Conventions

- Write clear, concise commit messages in the present tense (e.g., `Add filter form validation`).
- Group related changes into a single commit when possible.
- Reference relevant issues using the `#issue-number` shorthand in your commit message body when applicable.

## Pull Requests & Reviews

- Ensure all tests pass locally before submitting a pull request.
- Provide context in the pull request description: summarize the changes, explain the reasoning, and list any follow-up work.
- Link to any related issues or discussions.
- Expect reviewers to check for code quality, testing coverage, and adherence to project conventions. Be open to feedback and iterate as needed.
- After approval, squash or rebase your commits into a clean history before merging if project policy requires it.

We appreciate your contributions and the time you invest in improving NgSearch!
