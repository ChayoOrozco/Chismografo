UAT_HOST = akira@uat.argitic.com
UAT_DIR = ~/chismografo

.PHONY: dev deploy logs stop help

dev: ## Correr el servidor localmente
	node server.js

deploy: ## Deploy a UAT (rsync + docker build + up)
	rsync -avz --exclude node_modules --exclude .git --exclude data --exclude .env ./ $(UAT_HOST):$(UAT_DIR)/
	ssh $(UAT_HOST) 'cd $(UAT_DIR) && sudo docker compose build && sudo docker compose up -d'

logs: ## Ver logs en UAT
	ssh $(UAT_HOST) 'sudo docker logs -f chismografo'

stop: ## Detener el contenedor en UAT
	ssh $(UAT_HOST) 'cd $(UAT_DIR) && sudo docker compose down'

help: ## Mostrar targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'
