# Yari's CLI Tool

## Basic usage

Run the CLI tool:

```sh
yarn tool --help
```

## Commands

### validate-redirect

Validates the content of the `_redirects.txt` files(s). (This does not verify
that _to URLs_ exist)

### test-redirect

Test whether an URL path is a redirect and display the according target.

### add-redirect

Add a redirect to the `_redirects.txt`.

### delete

Delete a document (and optionally all children) by its slug. Optionally add an
redirect if deleting a single document. Also stages changes in `git` (except for
redirects).

### move

Move a document and its children. Adds the according redirects and stages
changes in `git` (except for redirects).

### edit

Open a document by its slug in the preferred editor (as per the `EDITOR`
environment variable).

### create

Open a _new_ document by its slug in the preferred editor (as per the `EDITOR`
environment variable).

### validate

Run basic validation for a document (only verifies the slug for now).

### preview

Open a preview of a given slug in your browser. This depends on a running
dev-server (`yarn start`).

### flaws

Show and optionally fix fixable flaws for a given slug.

### view-pr

Fetch PR changes from GitHub and preview them locally.
