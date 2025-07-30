---
title: Journal Archive
layout: layout.njk
permalink: index.html
---

<div class="h-feed">
  <h1 class="p-name">Journal Archive</h1>
  <p>Analog journal pages gone digital.</p><br />
{% for post in collections.journal | reverse %}
  <li>
    <a href="{{ post.url }}">
      {{ post.date | formatDate("MMMM d, yyyy") }}
    </a>
  </li>
{% endfor %}

</div>
