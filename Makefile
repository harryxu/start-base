IMAGE_NAME ?= harryxu/startbase
TAG ?= latest
PLATFORM ?= linux/amd64,linux/arm64

.PHONY: docker docker-push

docker:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/Dockerfile -t $(IMAGE_NAME):$(TAG) -t $(IMAGE_NAME):latest .
	@echo ""
	@echo "========================================================"
	@echo " Multi-architecture Docker images built successfully ($(PLATFORM))"
	@echo " To push these images to Docker Hub, run:"
	@echo "   make docker-push"
	@echo "   # or: make docker-push TAG=$(TAG)"
	@echo "========================================================"

docker-push:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/Dockerfile -t $(IMAGE_NAME):$(TAG) -t $(IMAGE_NAME):latest --push .
