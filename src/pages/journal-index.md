---
title: Journal Archive
layout: page-layout.njk
permalink: journal-index.html
eleventyNavigation:
  hidden: true
---

<div class="h-feed">
  <p>
    <span class="meta-svg" style="display:inline-block; margin-right:0.3rem; vertical-align:middle;">
      {% icon "notebook", { class: "meta-svg", width: 18, height: 18, style: "display:inline-block; margin-right:1.5rem;" } %}
    </span>
    Analog journal pages gone digital.<br />
    <small>Just everyday thoughts from an everyday gal. Blending my love of analog and digital content. Listed in reverse chronological order.</small>
  </p>
  <br />
  {% for post in collections.journal | reverse %}
    <li>
      <a href="{{ post.url | url }}">
        {{ post.data.title or (post.date | formatDate("MMMM d, yyyy")) }}
      </a>
    </li>
  {% endfor %}
</div>

