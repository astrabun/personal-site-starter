---
layout: base
---

# Hi, I'm {{ site.author.name }} 👋

This is my corner of the internet. Edit `src/index.md` to make it yours.

{% comment %} Each section only shows up once there's something in it. {% endcomment %}
{% if collections.artworks.size > 0 %}

## Recent work

{% assign recentWork = collections.artworks | newestFirst | limit: 6 %}
{% include "artwork-grid.liquid", artworks: recentWork %}

[All work &rarr;](/gallery/)
{% endif %}

{% if collections.posts.size > 0 %}

## Recent posts

{% assign recent = collections.posts | newestFirst | limit: 5 %}
{% include "post-list.liquid", posts: recent %}

[All posts &rarr;](/posts/)
{% endif %}
