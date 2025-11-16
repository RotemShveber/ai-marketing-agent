# AI Marketing Agent - Makefile for common commands

.PHONY: help install dev build start stop restart logs clean test

help: ## Show this help message
	@echo "AI Marketing Agent - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Done! ✅"

dev: ## Start development servers (without Docker)
	@echo "Starting backend..."
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload &
	@echo "Starting frontend..."
	cd frontend && npm run dev &
	@echo "Servers started! Frontend: http://localhost:3000, Backend: http://localhost:8000"

# Docker commands
build: ## Build Docker containers
	docker-compose build

start: ## Start all services with Docker
	docker-compose up -d
	@echo "Services started! Frontend: http://localhost:3000, Backend: http://localhost:8000"

stop: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs only
	docker-compose logs -f backend

logs-frontend: ## View frontend logs only
	docker-compose logs -f frontend

# Database
db-migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

db-reset: ## Reset database (WARNING: deletes all data)
	docker-compose down -v
	docker-compose up -d postgres redis
	sleep 5
	docker-compose exec backend alembic upgrade head

# Testing
test-backend: ## Run backend tests
	cd backend && source venv/bin/activate && pytest

test-frontend: ## Run frontend tests
	cd frontend && npm test

# Maintenance
clean: ## Clean up temporary files
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "node_modules" -exec rm -rf {} +
	find . -type d -name ".next" -exec rm -rf {} +
	@echo "Cleaned up temporary files! ✅"

clean-docker: ## Remove all Docker containers and volumes
	docker-compose down -v
	docker system prune -f

# Production
prod-build: ## Build for production
	cd frontend && npm run build
	@echo "Production build complete! ✅"

# Status
status: ## Check status of all services
	docker-compose ps

health: ## Health check all services
	@echo "Checking backend..."
	@curl -s http://localhost:8000/health || echo "Backend not responding"
	@echo "\nChecking frontend..."
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend OK" || echo "Frontend not responding"
