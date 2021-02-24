from elasticsearch_dsl import (
    Boolean,
    Document as ESDocument,
    Float,
    Keyword,
    Text,
    analyzer,
    token_filter,
    char_filter,
)

"""
A great way to debug analyzers is with the `Document._index.analyze()` API which
is a convenient abstraction for the Elasticsearch Analyze API
https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-analyze.html

But you can also use the Deployer CLI tool. For example:

    poetry run deployer search-analyze "l'avion" html_text_analyzer

An important thing to note is that if you change the analyzers (here in the Python
code) it won't take effect until you rebuild the index. So you might need to run

    # before
    poetry run deployer search-analyze "l'avion" html_text_analyzer
    poetry run deployer search-index ../client/build
    # after
    poetry run deployer search-analyze "l'avion" html_text_analyzer

"""

# This creates a token filter which is a "ruleset" that determines how any
# token should be expanded. For example, "front-end" becomes "front" and "end".
# There are many options to pick and each one needs to be carefully considered.
# To get a complete list of all the options, see the documentation at:
# https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-word-delimiter-tokenfilter.html
yari_word_delimiter = token_filter(
    "yari_word_delimiter",
    type="word_delimiter",
    # When it splits on 'Array.prototype.forEach' it first of all becomes
    # 'array', 'protoype', and 'foreach'. But also, still includes
    # as a word 'array.prototype.foreach'.
    # With this configuration we'll get good matches for both
    # 'array foreach' and if people type the full 'array.prototype.foreach'.
    preserve_original=True,
    # Otherwise things like 'WebGL' becomes 'web' and 'gl'.
    # And 'forEach' becomes 'each' because 'for' is a stopword.
    split_on_case_change=False,
    # Otherwise things like '3D' would be a search for '3' || 'D'.
    split_on_numerics=False,
)


keep_html_char_filter = char_filter(
    "keep_html_char_filter",
    type="pattern_replace",
    pattern="<([a-z]+)>",
    # The magic here is that turning things like `<video>` to `_video_`
    # and `<a>` to `_a_` means that it gets analyzed as its own token like that.
    # This way you can search for `<a>` and find `<a>: The Anchor element`.
    # But note that a search for `<section>` will *also* match
    # `<nav>: The Navigation Section element` because `<section>` is turned in the
    # the following two tokens: `['_section_', 'section']`.
    # Not great.
    # However, what if the user wants to find the page about the `<section>` HTML
    # tag and they search for `section`. Then it's a good thing that that token
    # expands to both forms.
    # A more extreme variant would be something that doesn't get token delimited.
    # For example:
    #
    #   `replacement="html$1html"`
    #
    # This would turn `<a>` to `htmlahtml` which means a search for `<a>` will
    # work expected but a search for `video` wouldn't match
    # the `<video>: The Video Embed element` page.
    replacement="_$1_",
)

text_analyzer = analyzer(
    "text_analyzer",
    tokenizer="standard",
    # The "asciifolding" token filter makes it so that
    # typing "bézier" becomes the same as searching for "bezier"
    # https://www.elastic.co/guide/en/elasticsearch/reference/7.9/analysis-asciifolding-tokenfilter.html
    filter=[
        yari_word_delimiter,
        # The "elison" token filter removes elisons from the text.
        # For example "l'avion" becomes "avion".
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-elision-tokenfilter.html
        "elision",
        "lowercase",
        "stop",
        # This makes it so you can search for either 'bézier' or 'bezier',
        # and end up matching to 'Bézier curve'.
        "asciifolding",
    ],
    # Note that we don't use the `html_strip` char_filter.
    # With that, we'd lose some of the valueable characters like: `<video>` which
    # is an actual title.
    char_filter=[keep_html_char_filter],
)


class Document(ESDocument):
    title = Text(required=True, analyzer=text_analyzer)
    body = Text(analyzer=text_analyzer)
    summary = Text(analyzer=text_analyzer)
    locale = Keyword()
    archived = Boolean()
    slug = Keyword()
    popularity = Float()

    class Index:
        name = "mdn_docs"
