IMAGE_NAME ?= harryxu/startbase
DEMO_IMAGE_NAME ?= harryxu/startbase-demo
TAG ?= latest
PLATFORM ?= linux/amd64,linux/arm64

.PHONY: docker docker-amd64 docker-arm64 docker-push docker-amd64-push docker-arm64-push \
        docker-demo docker-demo-amd64 docker-demo-arm64 docker-demo-push docker-demo-amd64-push docker-demo-arm64-push

# Require docker and docker buildx to be installed and enabled.
docker:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	@docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/Dockerfile -t $(IMAGE_NAME):$(TAG) -t $(IMAGE_NAME):latest . || { \
		echo ""; \
		echo "========================================================"; \
		echo " Build failed! If buildx failed due to missing binfmt/QEMU support, run:"; \
		echo "   docker run --privileged --rm tonistiigi/binfmt --install all"; \
		echo "========================================================"; \
		exit 1; \
	}
	@echo ""
	@echo "========================================================"
	@echo " Multi-architecture Docker images built successfully ($(PLATFORM))"
	@echo " To push these images to Docker Hub, run:"
	@echo "   make docker-push"
	@echo "   # or: make docker-push TAG=$(TAG)"
	@echo "========================================================"

docker-amd64:
	@$(MAKE) docker PLATFORM=linux/amd64

docker-arm64:
	@$(MAKE) docker PLATFORM=linux/arm64

docker-push:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	@docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/Dockerfile -t $(IMAGE_NAME):$(TAG) -t $(IMAGE_NAME):latest --push . || { \
		echo ""; \
		echo "========================================================"; \
		echo " Push failed! If buildx failed due to missing binfmt/QEMU support, run:"; \
		echo "   docker run --privileged --rm tonistiigi/binfmt --install all"; \
		echo "========================================================"; \
		exit 1; \
	}

docker-amd64-push:
	@$(MAKE) docker-push PLATFORM=linux/amd64

docker-arm64-push:
	@$(MAKE) docker-push PLATFORM=linux/arm64

# Demo Site Targets
docker-demo:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	@docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/demo-site.Dockerfile -t $(DEMO_IMAGE_NAME):$(TAG) -t $(DEMO_IMAGE_NAME):latest . || { \
		echo ""; \
		echo "========================================================"; \
		echo " Build failed! If buildx failed due to missing binfmt/QEMU support, run:"; \
		echo "   docker run --privileged --rm tonistiigi/binfmt --install all"; \
		echo "========================================================"; \
		exit 1; \
	}
	@echo ""
	@echo "========================================================"
	@echo " Multi-architecture Demo Docker images built successfully ($(PLATFORM))"
	@echo " To push these images to Docker Hub, run:"
	@echo "   make docker-demo-push"
	@echo "========================================================"

docker-demo-amd64:
	@$(MAKE) docker-demo PLATFORM=linux/amd64

docker-demo-arm64:
	@$(MAKE) docker-demo PLATFORM=linux/arm64

docker-demo-push:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	@docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/demo-site.Dockerfile -t $(DEMO_IMAGE_NAME):$(TAG) -t $(DEMO_IMAGE_NAME):latest --push . || { \
		echo ""; \
		echo "========================================================"; \
		echo " Push failed! If buildx failed due to missing binfmt/QEMU support, run:"; \
		echo "   docker run --privileged --rm tonistiigi/binfmt --install all"; \
		echo "========================================================"; \
		exit 1; \
	}

docker-demo-amd64-push:
	@$(MAKE) docker-demo-push PLATFORM=linux/amd64

docker-demo-arm64-push:
	@$(MAKE) docker-demo-push PLATFORM=linux/arm64


