# Copilot Instructions for Attendly

This document provides guidelines for GitHub Copilot to assist with code generation, reviews, and development practices for the Attendly attendance management application.

---

## Project Context

Attendly is a Next.js-based attendance management system for tracking and managing attendance records.

### Tech Stack

- **Frontend**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Node.js 20.10.0
- **Package Manager**: npm

### Project Structure

- `/src/app/`: Next.js App Router pages and layouts
- `/src/components/`: Reusable React components
- `/src/lib/`: Utility functions and shared logic
- `/public/`: Static assets (images, icons, etc.)
- `/api/`: API routes for backend functionality (future)
- Configuration files at root level

---

## Coding Standards for Attendly

### TypeScript Guidelines

- Use strict TypeScript with proper typing
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Export types and interfaces for reusability

### React/Next.js Best Practices

- Use App Router conventions
- Implement Server Components when possible
- Use proper file naming: kebab-case for files, PascalCase for components
- Keep components small and focused on single responsibility

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use semantic HTML elements
- Maintain consistent spacing and color schemes

## Review Steps

1. **Broad review**: Check if the PR description and content make sense.
2. **Phased review**: Review from large to small details:
   - PR size (suggest splitting if too large)
   - Design and data structures
   - API usability
   - Data handling
   - Tests and edge cases
3. **Security & Privacy**: Flag potential risks around data exposure, access control, or sensitive information.
4. **Forward progress**: Suggest follow-ups for non-blocking issues.
5. **Consistency**: Check for alignment with coding standards, naming conventions, and style guides.

---

## Writing Comments

- **Courtesy**: Focus on code, not the developer.
- **Explain why**: Clarify the rationale for suggestions.
- **Guidance**: Suggest fixes or point out problems for the developer to resolve.

---

## What to Look For

When reviewing code, focus on the following aspects to ensure high-quality contributions:

### Code Quality

- **Readability**: Is the code easy to understand? Are variable and function names meaningful?
- **Consistency**: Does the code follow the project's style guide and conventions?
- **Maintainability**: Can the code be easily modified or extended in the future?

### Functionality

- **Correctness**: Does the code do what it is supposed to do? Are edge cases handled?
- **Testing**: Are there sufficient tests to cover the functionality? Are the tests clear and reliable?
- **UI Changes**: Are any UI changes sensible and visually appropriate?

### Performance

- **Efficiency**: Are there unnecessary loops or computations? Are database queries optimized?
- **Scalability**: Will the code perform well as the system grows?
- **Big O Complexity**: Are time and space complexities reasonable?
- **Caching**: Are proper caching strategies implemented where appropriate?
- **Async/await Patterns**: Are asynchronous operations handled properly?
- **Memory Management**: Are there any memory leaks or excessive memory usage?

### Security

- **Input Validation**: Is user input properly validated?
- **Vulnerabilities**: Are there any potential security risks, such as SQL injection or XSS?
- **Authentication/Authorization**: Are proper checks in place?
- **Secrets Management**: Are credentials or sensitive data hardcoded?
- **OWASP Top 10**: Are common vulnerabilities addressed?

### Error Handling

- **Graceful Degradation**: Does the system fail gracefully in case of errors?
- **Proper Propagation**: Are errors propagated appropriately?
- **Logging**: Are errors logged appropriately for debugging?
- **Retry Logic**: Is retry logic implemented where necessary?
- **Circuit Breaker Patterns**: Are cascade failures prevented?

### Data & State

- **Immutability**: Are immutable data structures preferred where applicable?
- **State Management**: Is shared mutable state minimized?
- **Data Validation**: Is input/output validation performed at boundaries?
- **Idempotency**: Are operations safe to repeat?

### Testing

- **Coverage**: Are there appropriate unit and integration tests?
- **Design**: Are the tests well-designed, clear, and reliable?
- **Edge Cases**: Are edge cases sufficiently tested?
- **Performance Testing**: Are load testing and benchmarking included where necessary?
- **Test Data Management**: Are fixtures, factories, or test databases used effectively?

### Architecture

- **Event-Driven Patterns**: Are pub/sub or event sourcing patterns used appropriately?
- **Separation of Concerns**: Is the code modular and well-structured?
- **Avoid Over-Engineering**: Does the code solve the current problem without unnecessary generalization?

### Consistency

- **Style Guides**: Does the code follow the project's style guides?
- **Existing Code**: Is the code consistent with the existing codebase?

By combining these aspects, reviewers can ensure that the code meets the project's standards and is ready for integration.
