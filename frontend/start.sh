#!/bin/sh
envsubst '${PORT}' < /nginx.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
