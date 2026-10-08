---
layout: base
---

# Hi, I'm {{ site.author.name }} 👋

This is my corner of the internet. Edit `src/index.md` to make it yours.

## Recent posts

{% assign recent = collections.posts | newestFirst | limit: 5 %}
{% include "post-list.liquid", posts: recent %}

[All posts &rarr;](/posts/)
