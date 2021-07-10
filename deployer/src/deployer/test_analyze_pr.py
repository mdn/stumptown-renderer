import json
import tempfile
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch

from unidiff import PatchSet

from deployer.analyze_pr import analyze_pr, get_patch_lines


DEFAULT_CONFIG = {
    "prefix": None,
    "analyze_flaws": False,
    "analyze_dangerous_content": False,
    "repo": "mdn/content",
    "pr_number": None,
    "dry_run": False,
    "github_token": "",
    "diff_file": None,
    "max_urls": 99,
}


@contextmanager
def mock_build_directory(*docs):
    with tempfile.TemporaryDirectory() as tmpdirname:
        dirname = Path(tmpdirname)
        for i, doc in enumerate(docs):
            doc_dirname = dirname / f"doc{i}"
            doc_dirname.mkdir()
            with open(doc_dirname / "index.json", "w") as f:
                json.dump(doc, f)
        yield dirname


def test_analyze_pr_prefix():
    doc = {"doc": {"mdn_url": "/en-US/docs/Foo"}}
    with mock_build_directory(doc) as build_directory:
        comment = analyze_pr(build_directory, dict(DEFAULT_CONFIG, prefix="pr007"))
        assert "## Preview URLs" in comment
        assert "- <https://pr007.content.dev.mdn.mozit.cloud/en-US/docs/Foo>" in comment


def test_analyze_pr_flaws():
    doc = {
        "doc": {
            "mdn_url": "/en-US/docs/Foo",
            "title": "Foo",
            "flaws": {
                "faux_pas": [
                    {"explanation": "Socks in sandals"},
                    {"explanation": "Congrats on losing your cat"},
                ],
            },
            "source": {"github_url": "https://github.com/foo"},
        }
    }
    no_flaws_doc = {
        "doc": {
            "mdn_url": "/en-US/docs/Bar",
            "title": "Bar",
            "flaws": {},
            "source": {"github_url": "https://github.com/bar"},
        }
    }
    with mock_build_directory(no_flaws_doc, doc) as build_directory:
        comment = analyze_pr(build_directory, dict(DEFAULT_CONFIG, analyze_flaws=True))
        assert "## Flaws" in comment
        assert "1 document with no flaws that don't need to be listed" in comment
        assert "Flaw count: 2" in comment
        assert len(comment.split("\n---\n")) == 1
        assert "- **faux_pas**:" in comment
        assert "  - `Socks in sandals`" in comment
        assert "  - `Congrats on losing your cat`" in comment


def test_analyze_pr_dangerous_content():
    doc = {
        "doc": {
            "mdn_url": "/en-US/docs/Foo",
            "title": "Foo",
            "body": [
                {
                    "type": "prose",
                    "value": {
                        "content": """
            <p>
            <a href="https://www.peterbe.com">Peterbe.com</a>
            <a href="">Empty href</a>
            </p>
            """
                    },
                }
            ],
            "source": {"github_url": "https://github.com/foo"},
        }
    }
    with mock_build_directory(doc) as build_directory:
        comment = analyze_pr(
            build_directory, dict(DEFAULT_CONFIG, analyze_dangerous_content=True)
        )
        assert "## External URLs" in comment
        assert "  - <https://www.peterbe.com> (1 time)" in comment


def test_analyze_pr_dangerous_content_with_diff_file_matched():
    doc = {
        "doc": {
            "mdn_url": "/en-US/docs/Foo",
            "title": "Foo",
            "body": [
                {
                    "type": "prose",
                    "value": {
                        "content": """
            <p>
            <a href="https://www.peterbe.com">Peterbe.com</a>
            </p>
            """
                    },
                }
            ],
            "source": {
                "github_url": "https://github.com/foo",
                "folder": "en-us/mozilla/firefox/releases/4",
                "filename": "index.html",
            },
        }
    }
    with mock_build_directory(doc) as build_directory:
        diff_file = Path(__file__).parent / "sample.diff"
        comment = analyze_pr(
            build_directory,
            dict(
                DEFAULT_CONFIG,
                analyze_dangerous_content=True,
                diff_file=diff_file,
            ),
        )
        assert "## External URLs" in comment
        assert "  - <https://www.peterbe.com> (1 time)" in comment


def test_analyze_pr_dangerous_content_with_diff_file_not_matched():
    doc = {
        "doc": {
            "mdn_url": "/en-US/docs/Foo",
            "title": "Foo",
            "body": [
                {
                    "type": "prose",
                    "value": {
                        "content": """
            <p>
            <a href="https://www.mozilla.org">Mozilla.org</a>
            </p>
            """
                    },
                }
            ],
            "source": {
                "github_url": "https://github.com/foo",
                "folder": "en-us/mozilla/firefox/releases/4",
                "filename": "index.html",
            },
        }
    }
    with mock_build_directory(doc) as build_directory:
        diff_file = Path(__file__).parent / "sample.diff"
        comment = analyze_pr(
            build_directory,
            dict(
                DEFAULT_CONFIG,
                analyze_dangerous_content=True,
                diff_file=diff_file,
            ),
        )
        assert "## External URLs" in comment
        assert "No *new* external URLs" in comment
        assert "https://www.mozilla.org" not in comment


@patch("deployer.analyze_pr.Github")
def test_analyze_pr_prefix_and_postcomment(mocked_github):
    doc = {"doc": {"mdn_url": "/en-US/docs/Foo"}}
    with mock_build_directory(doc) as build_directory:
        comment = analyze_pr(
            build_directory,
            dict(DEFAULT_CONFIG, prefix="pr007", pr_number=123, github_token="abc123"),
        )
        assert "## Preview URLs" in comment
        assert "- <https://pr007.content.dev.mdn.mozit.cloud/en-US/docs/Foo>" in comment

    mocked_github().get_repo().get_issue().create_comment.assert_called()


def test_get_patch_lines_basic():
    with open("sample.diff") as f:
        patch = PatchSet(f.read())
    lines = get_patch_lines(patch)

    assert len(lines) == 4
    assert (
        "http://www.peterbe.com/about"
        in lines["files/en-us/mozilla/firefox/releases/4/index.html"]
    )
    assert "Hi Ryan" in lines["files/en-us/mdn/kitchensink/index.html"]
    assert "on Wikipedia (in Swedish)" in lines["files/en-us/glossary/png/index.html"]
    assert "Sample change!" in lines["files/en-us/web/api/event/index.html"]


def test_get_patch_lines_with_renames():
    with open("sample_with_renames.diff") as f:
        patch = PatchSet(f.read())
    lines = get_patch_lines(patch)

    assert len(lines) == 3
    assert "files/en-us/web/api/transitionevent/propertyname/index.html" in lines


def test_get_patch_lines_with_binaries():
    with open("sample_with_binaries.diff") as f:
        patch = PatchSet(f.read())
    lines = get_patch_lines(patch)
    assert "files/en-us/web/mathml/element/menclose/bottom.png" not in lines
    assert "files/en-us/web/mathml/element/menclose/index.html" in lines
