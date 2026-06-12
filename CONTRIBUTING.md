# Contributing

Thanks for your interest in contributing to tanstack-drizzle-devtools!

## Getting started

This is a [pnpm](https://pnpm.io/) monorepo:

- `packages/tanstack-drizzle-devtools` — the library
- `examples/tanstack-start` — TanStack Start example app

```bash
pnpm install
pnpm test
```

To try changes in the example app:

```bash
pnpm --filter tanstack-start-example dev
```

## Making changes

1. Fork the repository and create a branch from `main`.
2. Make your changes in the smallest scope that solves the problem.
3. Add or update tests when behavior changes (`packages/tanstack-drizzle-devtools`).
4. Run `pnpm test` before opening a pull request.
5. Open a pull request with a clear description of the change and why it is needed.

## Pull requests

- Keep PRs focused — one logical change per PR when possible.
- Match existing code style, naming, and patterns in the files you touch.
- Update the README when user-facing behavior or setup changes.

## Reporting issues

Open a [GitHub issue](https://github.com/kcoulsy/tanstack-drizzle-devtools/issues) with:

- What you expected to happen
- What actually happened
- Steps to reproduce (TanStack Start version, driver, and a minimal code sample help)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
