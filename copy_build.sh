#!/usr/bin/env sh

id=$(podman create "$1")
podman cp "$id":"$2" "$3"
podman rm -v "$id"
