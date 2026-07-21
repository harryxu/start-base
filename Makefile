IMAGE_NAME ?= harryxu/startbase
TAG ?= latest
PLATFORM ?= linux/amd64,linux/arm64

.PHONY: docker docker-push

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
