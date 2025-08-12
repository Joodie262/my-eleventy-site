---
title: Journal Archive
layout: page-layout.njk
permalink: journal-index.html
eleventyNavigation:
  hidden: true
---

<div class="h-feed">
  <p>Analog journal pages gone digital.</p><br />
{% for post in collections.journal | reverse %}
  <li>
    <a href="{{ post.url }}">
      {{ post.data.title or (post.date | formatDate("MMMM d, yyyy")) }}
    </a>
  </li>
{% endfor %}

</div>
