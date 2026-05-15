.PHONY: install dev build lint format typecheck test check

# Install dependencies
install:
	npm ci

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Run linter (Biome)
lint:
	npm run lint

# Format code (Biome)
format:
	npm run format

# Check TypeScript types
typecheck:
	npm run typecheck

# Run tests once
test:
	npm test -- --run

# Full quality gate check
check: lint typecheck test
