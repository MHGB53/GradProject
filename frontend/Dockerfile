# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – Collect assets
# No build toolchain is needed: the frontend is plain HTML / CSS / JS.
# Alpine is used purely as a minimal scratch pad to gather the files so the
# final Nginx image doesn't receive the full project build context.
# ─────────────────────────────────────────────────────────────────────────────
FROM alpine:3.20 AS assets

WORKDIR /static

COPY html/    ./html/
COPY css/     ./css/
COPY js/      ./js/
COPY assets/  ./assets/

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 – Serve with Nginx (production image)
# Only the gathered static files and the Nginx config end up in this layer,
# keeping the final image small and free of build-time artefacts.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default Nginx welcome page and config
RUN rm -f /etc/nginx/conf.d/default.conf /usr/share/nginx/html/index.html

# Custom reverse-proxy + static-serve config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Static assets gathered in Stage 1
COPY --from=assets /static/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
