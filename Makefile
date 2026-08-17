IMAGE_NAME ?= harryxu/startbase
DEMO_IMAGE_NAME ?= harryxu/startbase-demo
TAGS ?= latest
PLATFORM ?= linux/amd64,linux/arm64

.PHONY: \
	docker \
	docker-build-push \
	docker-build-amd64 \
	docker-build-arm64 \
	docker-push-amd64 \
	docker-push-arm64 \
	docker-push-manifest \
	docker-demo docker-demo-amd64 docker-demo-arm64 docker-demo-push docker-demo-amd64-push docker-demo-arm64-push

# =========================
# Build
# =========================

docker:
	@if echo "$(PLATFORM)" | grep -q ","; then \
		docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use; \
		docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/Dockerfile $(foreach tag,$(TAGS),-t $(IMAGE_NAME):$(tag)) . || { \
			echo ""; \
			echo "========================================================"; \
			echo " Build failed! If buildx failed due to missing binfmt/QEMU support, run:"; \
			echo "   docker run --privileged --rm tonistiigi/binfmt --install all"; \
			echo "========================================================"; \
			exit 1; \
		}; \
		echo ""; \
		echo "========================================================"; \
		echo " Multi-architecture Docker images built successfully ($(PLATFORM))"; \
		echo " To push these images to Docker Hub, run:"; \
		echo "   make docker-build-push"; \
		echo "========================================================"; \
	else \
		docker buildx build --platform $(PLATFORM) -f docker/Dockerfile $(foreach tag,$(TAGS),-t $(IMAGE_NAME):$(tag)) --load . || { \
			echo ""; \
			echo "========================================================"; \
			echo " Build failed!"; \
			echo "========================================================"; \
			exit 1; \
		}; \
	fi

docker-build-amd64:
	@$(MAKE) docker PLATFORM=linux/amd64 TAGS="$(TAGS) amd64"

docker-build-arm64:
	@$(MAKE) docker PLATFORM=linux/arm64 TAGS="$(TAGS) arm64"

# =========================
# Push
# =========================

# Build and push multi-architecture images in a single command
docker-build-push:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	@docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/Dockerfile $(foreach tag,$(TAGS),-t $(IMAGE_NAME):$(tag)) --push . || { \
		echo ""; \
		echo "========================================================"; \
		echo " Push failed! If buildx failed due to missing binfmt/QEMU support, run:"; \
		echo "   docker run --privileged --rm tonistiigi/binfmt --install all"; \
		echo "========================================================"; \
		exit 1; \
	}
	@echo ""
	@echo "========================================================"
	@echo " Multi-architecture Docker images built & pushed successfully ($(PLATFORM))"
	@echo " Tags: $(TAGS)"
	@echo "========================================================"

docker-push-amd64:
	@docker push $(IMAGE_NAME):amd64

docker-push-arm64:
	@docker push $(IMAGE_NAME):arm64

# =========================
# Create multi architecture manifest
# =========================

docker-push-manifest:
	@for tag in $(TAGS); do \
		echo "Creating manifest: $(IMAGE_NAME):$$tag"; \
		docker manifest create $(IMAGE_NAME):$$tag \
			$(IMAGE_NAME):amd64 \
			$(IMAGE_NAME):arm64; \
		docker manifest push $(IMAGE_NAME):$$tag; \
	done


# Demo Site Targets
docker-demo:
	@docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --driver docker-container --use
	@docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/demo-site.Dockerfile $(foreach tag,$(TAGS),-t $(DEMO_IMAGE_NAME):$(tag)) . || { \
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
	@docker buildx build --builder multi-builder --platform $(PLATFORM) -f docker/demo-site.Dockerfile $(foreach tag,$(TAGS),-t $(DEMO_IMAGE_NAME):$(tag)) --push . || { \
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



