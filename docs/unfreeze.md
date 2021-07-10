# Unfreeze locales

Unfreezing a locale includes:

1. unslugging
2. uplift - build from non-rendered content repo
3. have a community to maintain it

## Unslugging - original Slugs only

Moving to unified slugs has a lot of benefits:

- same information architecture for all translations
- moving documents can be automatically upstreamed to translated content
- document hierarchy will be the same across translations
- enable broader restructuring of MDN content
- easier for fix kumascript for translated content

Downsides:

- no translated urls (for now)
- orphaned (_unrooted_) documents
- quite a lot work / change

### Kumascript and moving on

Some kumascript API will be easier to implement that are currently broken for
translated content, like `subpagesExpand`.

```js
source["iObject"] = await page.subpagesExpand(
  "/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object"
);
```

Having a unified slugs will make any new system be simpler to build and
maintain.

### Unified hierarchy

```plain
tree -L 1 files/ja/
files/ja/
├── _redirects.txt
├── _wikihistory.json
├── about
├── adapting_xul_applications_for_firefox_1.5
├── adding_feed_readers_to_firefox
├── adding_search_engines_from_web_pages
├── addons.mozilla.org_(amo)_api_developers'_guide
├── ant_script_to_assemble_an_extension
├── aria
├── bugzilla-ja
├── bugzilla-jp
├── building_a_mozilla_distribution
├── building_an_extension
├── building_with_vc8_express
├── code_snippets
├── components
├── controlling_dns_prefetching
├── controlling_spell_checking_in_html_forms
├── creating_opensearch_plugins_for_firefox
├── creating_toolbar_buttons
├── css-2_quick_reference
├── debnews
├── determining_the_dimensions_of_elements
├── developing_add-ons
├── developing_mozilla
├── devnews
├── dhtml
├── dom
├── dom_client_object_cross-reference
├── dom_improvements_in_firefox_3
├── dom_inspector
├── dom_inspector_faq
├── dragdrop
├── drawing_text_using_a_canvas
├── dynamically_modifying_xul-based_user_interface
├── e4x
├── feed_content_access_api
├── findbar_api
├── full_page_zoom
├── games
├── glossary
├── hacking_mozilla
├── how_mozilla's_build_system_works
├── html_element_cross_reference
├── http_pipelining_faq
├── installing_extensions
├── installing_extensions_and_themes_from_web_pages
├── introduction_to_dom_inspector
├── introduction_to_using_xpath_in_javascript
├── javascript_modules
├── javascript_presentations
├── jetpack
├── key-navigable_custom_dhtml_widgets
├── lastindexof
├── learn
├── localization
├── localizing_extension_descriptions
├── map
├── mcd
├── mdn
├── mdn_at_ten
├── microsummary_xml_grammar_reference
├── migrate_apps_from_internet_explorer_to_mozilla
├── monitoring_http_activity
├── monitoring_wifi_access_points
├── mozilla
├── mozilla-central
├── mozilla_hacker's_getting_started_guide
├── mozilla_modules_and_module_ownership
├── mozilla_svg_status
├── mozistorageservice
├── mozmill
├── my_chrome_oven
├── namespace
├── new_in_javascript_1.8
├── notable_bugs_fixed_in_firefox_3
├── npapi
├── nsidomhtmlmediaelement
├── nsidynamiccontainer
├── participating_in_the_mozilla_project
├── plugins
├── reftest_opportunities_files
├── setting_up_extension_development_environment
├── svg_improvements_in_firefox_3
├── svg_in_firefox
├── the_add-on_bar
├── the_importance_of_correct_html_commenting
├── tips_for_authoring_fast-loading_html_pages
├── title
├── toolkit_api
├── tools
├── tutorials
├── updating_extensions_for_firefox_2
├── updating_extensions_for_firefox_3
├── updating_extensions_for_firefox_3.1
├── updating_web_applications_for_firefox_3
├── user_agent_strings_reference
├── using_firefox_1.5_caching
├── using_native_json
├── using_url_values_for_the_cursor_property
├── using_xpath
├── view_source
├── web
├── web_content_accessibility_guidelines_1.0
├── web_development
├── webapi
├── webassembly
├── width
├── xmlserializer
├── xpcom_components_list
├── xpcom_part_1
├── xpcom_part_2
├── xpcom_part_3
├── xpcom_part_4
├── xpcom_part_5
├── xpcom_plans
├── xpinstall_api_reference
└── xsltprocessor

116 directories, 2 files
```

```plain
tree -L 1 files/ja/
files/ja/
├── _redirects.txt
├── _wikihistory.json
├── games
├── glossary
├── learn
├── mdn
├── mdn_at_ten
├── mozilla
├── plugins
├── tools
├── unrooted
├── web
└── webassembly

11 directories, 2 files
```

### Implementation and Real World Problems

Given that each translated document has exactly one original document in the
_en-us_ locale and each original document has exactly one translation per
locale, everything would be straight forward. Just move replace the slug with
the `translation_of`, move the file and update `wikihistories` and `redirects`.
Simple, right?

Unfortunately that's not the case. We ran into part of this issue when moving to
yari. This is why we added `translation_of_original` we also have
`translation_of` pointing to a
[fragment](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Identifying_resources_on_the_Web#fragment)
which most of the time conflicts with a `translation_of` pointing to the same
document without the fragment. On top of that we have `translation_of` pointing
to deleted documents with is often combined with pointing to a redirect which
again yields conflicts with other translations.

These should cover all cases and how to resolve them:

1. ✓ `translation_of` matches the slug and is not a redirect
2. ❌ `translation_of` is a redirect
   - resolve redirect and continue
3. ❌ `translation_of` does not match the slug
   - use `translation_of`
4. ❌ `translation_of` does not exist in _en-us_
   - prefix with `unrooted`
5. ❌ slug contains a `#`
   - remove everything after the `#`
6. ❌ `translation_of` already has a document in the locale
   - try `translation_of_original` if available otherwise prefix with `unrooted`
7. ❌ `translation_of` already has a document in the locale
   - prefix with `unrooted`

## Uplift

Uplifting a locale means to move from
[mdn/translated-content-rendered](https://github.com/mdn/translated-content-rendered)
(kuma-rendered) to
[mdn/translated-content](https://github.com/mdn/translated-content)
(yari-rendered) for a locale.

The reason we do not yet yari-render translated content is that kumascript
breaks. Hence the major step towards uplifting is fixing / deleting broken
kumascript.
