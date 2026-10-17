---
layout: page
title: Gallery
permalink: /gallery/
wide: true
---

{% assign artworks = collections.artworks | newestFirst %}
{% include "artwork-grid.liquid", artworks: artworks %}
