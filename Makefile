IMAGE_NAME ?= harryxu/startbase
TAG ?= latest

.PHONY: docker


docker:
	docker build -f docker/Dockerfile -t $(IMAGE_NAME):$(TAG) -t $(IMAGE_NAME):latest .
	@echo ""
	@echo "========================================================"
	@echo " Docker images built successfully:"
	@echo "   - $(IMAGE_NAME):$(TAG)"
	@echo "   - $(IMAGE_NAME):latest"
	@echo " To push these images to Docker Hub, run:"
	@echo "   docker push $(IMAGE_NAME):$(TAG)"
	@echo "   docker push $(IMAGE_NAME):latest"
	@echo "========================================================"
