---
layout: page
title: Blog
permalink: /posts/
---

{% assign posts = collections.posts | newestFirst %}
{% include "post-list.liquid", posts: posts %}
