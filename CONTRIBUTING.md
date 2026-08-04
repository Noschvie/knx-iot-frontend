# Contributing

First of all, thank you for considering contributing to the KNX IoT Frontend!

Contributions of all kinds are welcome, including bug reports, feature requests, documentation improvements, code contributions, and discussions about the project architecture.

## Project Philosophy

The goal of this project is to provide a clean, maintainable, and standards-oriented implementation of a KNX IoT frontend.

**Standards compliance, clean architecture, and long-term maintainability are preferred over quick feature implementation.**

When contributing, please aim for solutions that are:

- Easy to understand
- Well documented
- Consistent with the existing architecture
- Modular and reusable
- Easy to maintain and extend

Whenever possible, discuss larger architectural changes in an issue before starting implementation.

## Getting Started

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a Pull Request.

Please keep Pull Requests focused on a single topic whenever possible.

---

# Development Guidelines

## General Principles

- Prefer readability over cleverness.
- Keep components small and focused.
- Avoid unnecessary complexity.
- Avoid code duplication.
- Document architectural decisions.
- Write self-explanatory code whenever possible.

## Code Style

- Follow the existing project style.
- Use meaningful names for variables, functions and components.
- Keep functions short and focused.
- Remove unused code before submitting a Pull Request.

---

# Internationalization (i18n)

The project uses **i18next** for all user-facing text.

### Guidelines

- Never hard-code visible UI strings.
- Always use translation keys.
- Keep translation keys descriptive.
- Reuse existing keys whenever possible.
- Update all supported languages when adding new UI elements.

Example:

✅ Good

```tsx
const { t } = useTranslation();

<Button>{t("devices.add")}</Button>
```

❌ Avoid

```tsx
<Button>Add Device</Button>
```

For additional information see:

```
docs/internationalization.md
```

---

# KNX Terminology

The frontend follows the official KNX terminology whenever possible.

The following terms should normally remain untranslated:

- KNX
- KNX IoT
- KNX Secure
- DPT
- Datapoint Type
- Group Address (GA)
- Individual Address (IA)
- CoAP
- OSCORE
- Thread
- IPv6

---

# Pull Requests

Before submitting a Pull Request, please verify that:

- [ ] The project builds successfully.
- [ ] New functionality has been tested.
- [ ] No debug code remains.
- [ ] No visible UI strings are hard-coded.
- [ ] Documentation has been updated where appropriate.
- [ ] Translation files have been updated if necessary.

---

# Reporting Issues

When opening an issue, please include:

- A clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and operating system
- Console output (if relevant)

---

# Questions

If you are unsure about an implementation or architectural decision, please open an issue before starting larger changes.

Discussion is always welcome.
